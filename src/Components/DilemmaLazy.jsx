import { Suspense, lazy } from "react";

const Dictator = lazy(() => import("../ThoughtDilemmas/Dictator"));
const Volunteer = lazy(() => import("../ThoughtDilemmas/Volunteer"));
const Exchange = lazy(() => import("../ThoughtDilemmas/Exchange"));
const Trust = lazy(() => import("../ThoughtDilemmas/Trust"));

/**
 * Code-splits each dilemma into its own chunk so the main bundle stays smaller;
 * nested Suspense avoids the full-screen loading fallback when a chunk loads.
 */
export function LazyDictator(props) {
  return (
    <Suspense fallback={null}>
      <Dictator {...props} />
    </Suspense>
  );
}

export function LazyVolunteer(props) {
  return (
    <Suspense fallback={null}>
      <Volunteer {...props} />
    </Suspense>
  );
}

export function LazyExchange(props) {
  return (
    <Suspense fallback={null}>
      <Exchange {...props} />
    </Suspense>
  );
}

export function LazyTrust(props) {
  return (
    <Suspense fallback={null}>
      <Trust {...props} />
    </Suspense>
  );
}
