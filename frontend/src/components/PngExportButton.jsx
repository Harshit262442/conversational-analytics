import html2canvas from 'html2canvas';

export default function PngExportButton({ targetRef, queryId, onExport }) {
  async function save() {
    if (!targetRef?.current) return;
    const canvas = await html2canvas(targetRef.current, {
      backgroundColor: '#0d1130',
      scale: 2,
    });
    const link = document.createElement('a');
    link.download = `chart_${queryId || 'result'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    if (onExport) onExport();
  }
  return <button onClick={save}>🖼️ Export PNG</button>;
}
