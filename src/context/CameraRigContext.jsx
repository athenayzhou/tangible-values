import { createContext, useContext } from "react";

export const CameraRigContext = createContext(null);

export function useCameraRig() {
  const ctx = useContext(CameraRigContext);
  if (ctx == null) {
    throw new Error("useCameraRig must be used inside CameraRig");
  }
  return ctx;
}
