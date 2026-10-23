// Separated into its own file so React Fast Refresh works correctly.
// A file must export only components OR only non-components — mixing both
// causes HMR invalidation which breaks all button state.
export { useAttendance } from './AttendanceContext';
