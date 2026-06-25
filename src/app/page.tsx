import Link from "next/link";

const demos = [
  {
    href: "/demo/error",
    title: "1. Error Tracking",
    description: "Trigger an unhandled client-side exception and watch it appear in Sentry with a full stack trace.",
    feature: "Issues",
    color: "border-red-500",
    badge: "bg-red-500",
  },
  {
    href: "/demo/performance",
    title: "2. Performance Monitoring",
    description: "Call a slow API route and see the transaction trace with slow spans highlighted in Sentry.",
    feature: "Performance",
    color: "border-yellow-500",
    badge: "bg-yellow-500",
  },
  {
    href: "/demo/replay",
    title: "3. Session Replay",
    description: "Fill out a multi-step form that crashes on submit — then watch the session replay in Sentry.",
    feature: "Replay",
    color: "border-blue-500",
    badge: "bg-blue-500",
  },
  {
    href: "/demo/alerts",
    title: "4. Alerts & Notifications",
    description: "Trigger a server-side 500 error and see Sentry create an issue and fire a configured alert rule.",
    feature: "Alerts",
    color: "border-orange-500",
    badge: "bg-orange-500",
  },
  {
    href: "/demo/release",
    title: "5. Release Tracking",
    description: "Throw a version-tagged error and see Sentry attribute it to the current release.",
    feature: "Releases",
    color: "border-green-500",
    badge: "bg-green-500",
  },
  {
    href: "/demo/seer-cart",
    title: "6. Seer Autofix — Cart Null Reference",
    description: "Trigger a TypeError from an empty cart, then use Seer to auto-fix src/lib/cart.ts and open a GitHub PR.",
    feature: "Autofix",
    color: "border-purple-500",
    badge: "bg-purple-500",
  },
  {
    href: "/demo/seer-checkout",
    title: "7. Seer Autofix — Unhandled Promise",
    description: "Submit a $0 checkout to crash the server route, then let Seer add try/catch and create a PR.",
    feature: "Autofix",
    color: "border-purple-500",
    badge: "bg-purple-500",
  },
  {
    href: "/demo/seer-recommendations",
    title: "8. Seer Autofix — Off-by-One Array",
    description: "Pass userId=100 to overflow the product array, then watch Seer clamp the index and open a PR.",
    feature: "Autofix",
    color: "border-purple-500",
    badge: "bg-purple-500",
  },
];

export default function HomePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Interactive Sentry Evaluation</h1>
      <p className="text-gray-400 mb-10">
        Click each demo below, trigger the scenario, then open your{" "}
        <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="text-violet-400 underline">
          Sentry dashboard
        </a>{" "}
        to see the data captured in real time.
      </p>

      <div className="grid gap-4">
        {demos.map((demo) => (
          <Link
            key={demo.href}
            href={demo.href}
            className={`block rounded-xl border-l-4 ${demo.color} bg-gray-900 px-6 py-5 hover:bg-gray-800 transition-colors`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-lg">{demo.title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full text-white ${demo.badge}`}>{demo.feature}</span>
            </div>
            <p className="text-gray-400 text-sm">{demo.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
