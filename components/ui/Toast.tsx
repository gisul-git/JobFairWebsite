"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

type ToastType = "success" | "error" | "info";

export default function Toast(props: {
  message: string;
  type: ToastType;
  visible: boolean;
  duration?: number;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!props.visible) return;
    const id = window.setTimeout(() => {
      props.onClose();
    }, props.duration ?? 3000);

    return () => window.clearTimeout(id);
  }, [props.duration, props.message, props.onClose, props.visible]);

  const background =
    props.type === "success"
      ? "rgba(34,197,94,0.9)"
      : props.type === "error"
        ? "rgba(239,68,68,0.9)"
        : "rgba(105,82,162,0.9)";

  return (
    <AnimatePresence>
      {props.visible ? (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.9 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed bottom-6 right-6 z-50 w-[300px] rounded-xl px-4 py-3 text-white shadow-2xl backdrop-blur-md"
          style={{ background }}
        >
          <div className="text-sm font-semibold">{props.message}</div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
