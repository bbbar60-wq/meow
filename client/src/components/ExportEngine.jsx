import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import useStore from '../store';

export default function ExportEngine() {
  const { gl, scene, camera } = useThree();
  const { isExporting, isCancelled, updateProgress, finishExport } = useStore();

  useEffect(() => {
    if (!isExporting) return;

    let progress = 0;
    let frameId = null;
    const originalPixelRatio = gl.getPixelRatio();

    // Helper to sleep for UI updates
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const runExportSequence = async () => {
      // 1. Warm Up & Stabilization Loop (0% - 80%)
      // This allows us to show progress and lets shadows/effects settle.
      for (let i = 0; i <= 80; i += 5) {
        if (useStore.getState().isCancelled) {
          gl.setPixelRatio(originalPixelRatio); // Safety reset
          return;
        }

        progress = i;
        updateProgress(progress);

        // Render a frame to keep the loop "alive" for the GPU
        gl.render(scene, camera);

        // Small delay to allow React UI to repaint the progress bar
        await wait(50);
      }

      // 2. High-Fidelity Capture Setup
      if (useStore.getState().isCancelled) return;
      updateProgress(90);

      try {
        // "TOP NOTCH" Quality: Boost pixel density to 4x (or hardware max)
        // This creates a 4K+ resolution image even on standard screens.
        const highQualityRatio = Math.min(window.devicePixelRatio * 4, 4);
        gl.setPixelRatio(highQualityRatio);

        // Force a clear and render at high res
        // Note: If using EffectComposer, it usually auto-renders, but explicit render ensures update
        gl.render(scene, camera);

        // 3. Capture Data
        const dataUrl = gl.domElement.toDataURL('image/png', 1.0);

        // 4. Download Trigger
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.setAttribute('download', `render-${timestamp}.png`);
        link.setAttribute('href', dataUrl);
        link.click();

        updateProgress(100);
        await wait(500); // Let user see 100% briefly
        finishExport();

      } catch (error) {
        console.error("Export failed:", error);
        finishExport(); // Fail gracefully
      } finally {
        // 5. Cleanup: Restore original performance settings
        gl.setPixelRatio(originalPixelRatio);
      }
    };

    runExportSequence();

    return () => {
      // Cleanup if component unmounts mid-render
      gl.setPixelRatio(originalPixelRatio);
    };
  }, [isExporting, gl, scene, camera]);

  return null; // This component has no visual 3D elements
}