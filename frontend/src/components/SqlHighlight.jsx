// Lightweight SQL syntax highlighter — no external library.
// Tokenizes a string into spans with classes for css coloring.

const KEYWORDS = new Set([
  'select','from','where','and','or','not','in','is','null','as','on',
  'join','left','right','inner','outer','full','cross','using',
  'group','by','order','having','limit','offset','distinct','all','union',
  'case','when','then','else','end','between','like','exists','with',
  'asc','desc','count','sum','avg','min','max','round','coalesce','ifnull',
  'date','date_sub','date_add','curdate','now','year','month','day',
  'interval','day','week','month','year','quarter','hour','minute','second',
  'true','false','having','over','partition',
]);

export default function SqlHighlight({ sql }) {
  if (!sql) return null;

  // Token regex: strings, numbers, identifiers (including dotted), comments, punctuation
  const re = /('[^']*'|"[^"]*"|`[^`]*`|--[^\n]*|\/\*[\s\S]*?\*\/|\b\d+(?:\.\d+)?\b|\b\w+\b|\s+|[^\s\w])/g;
  const tokens = sql.match(re) || [];

  return (
    <code className="sql-pretty">
      {tokens.map((t, i) => {
        if (/^\s+$/.test(t))                               return <span key={i}>{t}</span>;
        if (t.startsWith('--') || t.startsWith('/*'))      return <span key={i} className="tok-com">{t}</span>;
        if (/^['"`]/.test(t))                              return <span key={i} className="tok-str">{t}</span>;
        if (/^\d/.test(t))                                 return <span key={i} className="tok-num">{t}</span>;
        if (/^\w+$/.test(t) && KEYWORDS.has(t.toLowerCase())) return <span key={i} className="tok-kw">{t}</span>;
        if (/^\w+$/.test(t))                               return <span key={i} className="tok-id">{t}</span>;
        return <span key={i} className="tok-pun">{t}</span>;
      })}
    </code>
  );
}
