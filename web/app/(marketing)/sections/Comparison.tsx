import { Check, X } from "lucide-react";

const rows = [
  { feature: "Native mobile board", fp: true, competitor: false },
  { feature: "Telegram voting", fp: true, competitor: false },
  { feature: "Source insights", fp: true, competitor: false },
  { feature: "Public board & roadmap", fp: true, competitor: true },
];

export function Comparison() {
  return (
    <section className="bg-page py-20">
      <div className="mx-auto max-w-page px-6">
        <h2 className="text-2xl font-bold text-text text-center mb-12">
          How is it better than features.vote?
        </h2>

        <div className="max-w-2xl mx-auto overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 pr-4 font-semibold text-text">Feature</th>
                <th className="text-center py-3 px-4 font-semibold text-accent">FeaturePoll</th>
                <th className="text-center py-3 pl-4 font-semibold text-text-muted">features.vote</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.feature} className="border-b border-border last:border-b-0">
                  <td className="py-3 pr-4 text-text">{row.feature}</td>
                  <td className="py-3 px-4 text-center">
                    {row.fp ? (
                      <Check className="w-5 h-5 text-success mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-text-faint mx-auto" />
                    )}
                  </td>
                  <td className="py-3 pl-4 text-center">
                    {row.competitor ? (
                      <Check className="w-5 h-5 text-success mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-text-faint mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
