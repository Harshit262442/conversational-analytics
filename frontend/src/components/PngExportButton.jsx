import html2canvas from 'html2canvas';

export default function PngExportButton({ targetRef, queryId }) {
  async function save() {
    if (!targetRef?.current) return;
    const canvas = await html2canvas(targetRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
    });
    const link = document.createElement('a');
    link.download = `chart_${queryId || 'result'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
  return <button onClick={save}>🖼️ Export PNG</button>;
}
