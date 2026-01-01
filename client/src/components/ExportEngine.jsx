import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import useStore from '../store';

export default function ExportEngine() {
  const { gl, scene, camera } = useThree();
  const isExporting = useStore((state) => state.isExporting);
  const isCancelled = useStore((state) => state.isCancelled);
  const updateProgress = useStore((state) => state.updateProgress);
  const finishExport = useStore((state) => state.finishExport);

  useEffect(() => {
    if (!isExporting) return;

    let progress = 0;
    const originalPixelRatio = gl.getPixelRatio();

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const runExportSequence = async () => {
      for (let i = 0; i <= 80; i += 5) {
        if (isCancelled || useStore.getState().isCancelled) {
          gl.setPixelRatio(originalPixelRatio);
          return;
        }

        progress = i;
        updateProgress(progress);
        gl.render(scene, camera);
        await wait(50);
      }

      if (isCancelled || useStore.getState().isCancelled) return;
      updateProgress(90);

      try {
        const highQualityRatio = Math.min(window.devicePixelRatio * 4, 4);
        gl.setPixelRatio(highQualityRatio);
        gl.shadowMap.needsUpdate = true;

        gl.render(scene, camera);

        const dataUrl = gl.domElement.toDataURL('image/png', 1.0);

        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.setAttribute('download', `render-${timestamp}.png`);
        link.setAttribute('href', dataUrl);
        link.click();

        updateProgress(100);
        await wait(500);
        finishExport();

      } catch (error) {
        console.error("Export failed:", error);
        finishExport();
      } finally {
        gl.setPixelRatio(originalPixelRatio);
      }
    };

    runExportSequence();

    return () => {
      gl.setPixelRatio(originalPixelRatio);
    };
  }, [camera, finishExport, gl, isCancelled, isExporting, scene, updateProgress]);

  return null;
}
