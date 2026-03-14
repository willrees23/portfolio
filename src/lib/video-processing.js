import ffmpeg from "fluent-ffmpeg";

export function probeVideo(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const video = metadata.streams.find((s) => s.codec_type === "video");
      if (!video) return reject(new Error("No video stream found"));
      resolve({
        width: video.width,
        height: video.height,
        duration: parseFloat(metadata.format.duration),
        codec: video.codec_name,
      });
    });
  });
}

function roundEven(n) {
  const r = Math.round(n);
  return r % 2 === 0 ? r : r + 1;
}

export function processVideo(
  inputPath,
  outputPath,
  regions,
  sourceWidth,
  sourceHeight,
  outputWidth,
  outputHeight,
  duration,
  onProgress
) {
  return new Promise((resolve, reject) => {
    const filters = [];
    const overlays = [];

    regions.forEach((region, i) => {
      const cropX = roundEven(region.sourceX * sourceWidth);
      const cropY = roundEven(region.sourceY * sourceHeight);
      const cropW = roundEven(region.sourceW * sourceWidth);
      const cropH = roundEven(region.sourceH * sourceHeight);
      const scaleW = roundEven(region.canvasW * outputWidth);
      const scaleH = roundEven(region.canvasH * outputHeight);
      const overlayX = Math.round(region.canvasX * outputWidth);
      const overlayY = Math.round(region.canvasY * outputHeight);

      filters.push(
        `[0:v]crop=${cropW}:${cropH}:${cropX}:${cropY},scale=${scaleW}:${scaleH}[r${i}]`
      );

      const baseLabel = i === 0 ? "base" : `tmp${i - 1}`;
      const outLabel = i === regions.length - 1 ? "out" : `tmp${i}`;
      overlays.push(
        `[${baseLabel}][r${i}]overlay=${overlayX}:${overlayY}[${outLabel}]`
      );
    });

    const dur = Math.ceil(duration);
    const filterComplex = [
      `color=c=black:s=${outputWidth}x${outputHeight}:d=${dur}:r=30[base]`,
      ...filters,
      ...overlays,
    ].join(";");

    const cmd = ffmpeg(inputPath)
      .complexFilter(filterComplex)
      .outputOptions([
        "-map", "[out]",
        "-map", "0:a?",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "23",
        "-c:a", "aac",
        "-movflags", "+faststart",
        "-shortest",
      ])
      .output(outputPath);

    cmd.on("progress", (info) => {
      if (info.percent != null) {
        onProgress(Math.min(100, Math.round(info.percent)));
      }
    });

    cmd.on("end", () => {
      onProgress(100);
      resolve();
    });

    cmd.on("error", (err) => {
      reject(err);
    });

    cmd.run();
  });
}
