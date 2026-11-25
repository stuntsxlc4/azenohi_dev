# Presentation state

React Router owns the destination and browser history. Presentation state retains the last orbital location, the outgoing orbital location during its brief fade and whether Journey has ever mounted. A route section loses interaction and accessibility exposure immediately on departure. A cancelled timeout cannot remove the newer outgoing route.

The shell owns the explicit motion choice, system preference, page visibility, scene readiness, failure and environment coverage. The Canvas owns DPR and object transforms. Orbit transitions run the normal frame loop while visible, use demand mode in Pause and use never mode while covered or backgrounded. R3F resets its frame clock when switching modes. Hidden elapsed time is excluded from the next orbital step.

The catalogue continues to own its history record with the invoking card ID and scroll offset. All presentation state is scoped to the current document.
