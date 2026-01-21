/**
 * Feature Cards
 * AI Pipeline and Your Workflow cards
 */
export default function FeatureCards({ activeStep }) {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2">
      {/* AI Pipeline Card */}
      <div className="group rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] p-6 ring-1 ring-white/10 transition-all duration-300 hover:ring-[#7BAFD4]/30 hover:shadow-lg hover:shadow-[#7BAFD4]/10">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-semibold text-white">AI Pipeline</div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Active
          </span>
        </div>
        <div className="mt-5 space-y-3">
          {[
            "Classify intent & category",
            "Score priority and route",
            "Generate draft from FAQ",
            "Await staff approval",
          ].map((step, i) => (
            <div
              key={step}
              className={`flex items-center gap-3 transition-all duration-500 ${activeStep === i ? "translate-x-1" : ""}`}
            >
              <span
                className={`h-2 w-2 rounded-full transition-all duration-500 ${
                  activeStep === i
                    ? "bg-[#7BAFD4] shadow-lg shadow-[#7BAFD4]/50 scale-125"
                    : activeStep > i
                      ? "bg-[#7BAFD4]/50"
                      : "bg-white/25"
                }`}
                aria-hidden="true"
              />
              <span
                className={`text-sm transition-colors duration-500 ${
                  activeStep === i ? "text-white font-medium" : "text-slate-300"
                }`}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Your Workflow Card */}
      <div className="group rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] p-6 ring-1 ring-white/10 transition-all duration-300 hover:ring-[#7BAFD4]/30 hover:shadow-lg hover:shadow-[#7BAFD4]/10">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <span className="text-lg" aria-hidden="true">
            👤
          </span>
          Your Workflow
        </div>
        <ul className="mt-5 space-y-4">
          {[
            { num: "1", text: "Open the approval queue and pick the next email", icon: "📬" },
            { num: "2", text: "Review the AI draft and edit for tone/policy", icon: "✍️" },
            { num: "3", text: "Approve to send or reject to reroute", icon: "✅" },
          ].map((item) => (
            <li key={item.num} className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#7BAFD4]/20 text-xs font-bold text-[#7BAFD4] ring-1 ring-[#7BAFD4]/30">
                {item.num}
              </span>
              <span className="flex-1 text-sm text-slate-200">
                <span className="mr-1.5" aria-hidden="true">
                  {item.icon}
                </span>
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
