import { PRECISION_FORMATS } from '../data/precisionFormats';

const MAX_BITS = 64;

export function PrecisionFormats() {
  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-xs text-muted uppercase tracking-widest">Floating-Point Formats</span>

      {/* Stacked bit-field bars — bar width proportional to totalBits */}
      <div className="flex flex-col gap-2">
        {PRECISION_FORMATS.map((f) => {
          const signPct = (1 / f.totalBits) * 100;
          const expPct = (f.exponentBits / f.totalBits) * 100;
          const manPct = (f.mantissaBits / f.totalBits) * 100;
          const barWidthPct = (f.totalBits / MAX_BITS) * 100;

          return (
            <div key={f.name} className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-muted w-20 shrink-0">{f.name}</span>
              <div
                className="flex h-5 rounded overflow-hidden shrink-0"
                style={{ width: `${barWidthPct}%` }}
              >
                {/* Sign bit (1 bit) */}
                <div style={{ width: `${signPct}%` }} className="bg-[#e85d9a] shrink-0" />
                {/* Exponent bits */}
                {f.exponentBits > 0 && (
                  <div
                    style={{ width: `${expPct}%` }}
                    className="bg-[#58a6ff] flex items-center justify-center shrink-0 overflow-hidden"
                  >
                    {f.exponentBits >= 4 && (
                      <span className="font-mono text-[8px] text-white whitespace-nowrap px-0.5">
                        {f.exponentBits}e
                      </span>
                    )}
                  </div>
                )}
                {/* Mantissa bits */}
                <div
                  style={{ width: `${manPct}%` }}
                  className="bg-[#3fb950] flex items-center justify-center overflow-hidden"
                >
                  {f.mantissaBits >= 7 && f.exponentBits > 0 && (
                    <span className="font-mono text-[8px] text-white whitespace-nowrap px-0.5">
                      {f.mantissaBits}m
                    </span>
                  )}
                </div>
              </div>
              <span className="font-mono text-[10px] text-muted">{f.approxDecimalDigits} sig. digits</span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 font-mono text-[10px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#e85d9a]" /> sign (1 bit)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#58a6ff]" /> exponent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#3fb950]" /> mantissa
        </span>
      </div>

      {/* Detail table */}
      <div className="border border-edge rounded overflow-auto">
        <table className="font-mono text-[10px] border-collapse w-full">
          <thead>
            <tr>
              <th className="text-left text-muted px-2 py-1 border-b border-edge uppercase tracking-wider text-[9px]">Format</th>
              <th className="text-center text-muted px-2 py-1 border-b border-edge text-[9px]">Bits</th>
              <th className="text-center text-[#58a6ff] px-2 py-1 border-b border-edge text-[9px]">Exp</th>
              <th className="text-center text-[#3fb950] px-2 py-1 border-b border-edge text-[9px]">Mantissa</th>
              <th className="text-center text-muted px-2 py-1 border-b border-edge text-[9px]">~Decimals</th>
              <th className="text-left text-muted px-2 py-1 border-b border-edge text-[9px]">Use Case</th>
            </tr>
          </thead>
          <tbody>
            {PRECISION_FORMATS.map((f) => (
              <tr key={f.name} className="hover:bg-[#161b22]">
                <td className="text-primary px-2 py-1 border-b border-edge">{f.name}</td>
                <td className="text-muted text-center px-2 py-1 border-b border-edge">{f.totalBits}</td>
                <td className="text-[#58a6ff] text-center px-2 py-1 border-b border-edge">{f.exponentBits === 0 ? '—' : f.exponentBits}</td>
                <td className="text-[#3fb950] text-center px-2 py-1 border-b border-edge">{f.mantissaBits}</td>
                <td className="text-muted text-center px-2 py-1 border-b border-edge">{f.approxDecimalDigits}</td>
                <td className="text-muted px-2 py-1 border-b border-edge">{f.useCase}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="font-mono text-[10px] text-muted leading-relaxed">
        BF16 and FP32 share the same 8-bit exponent — identical dynamic range — so BF16 is drop-in safe
        for training where FP16 overflows. FP8 halves the bits again; hardware relies on per-tensor
        scale factors to compensate for the minimal mantissa.
      </p>
    </div>
  );
}
