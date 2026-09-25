import React from "react";
import { navigate } from "../lib/navigation.js";

export default function Brand({ compact = false }) {
  return (
    <button
      type="button"
      className={compact ? "brand brand-compact" : "brand"}
      aria-label="JRVX — на главную"
      onClick={() => navigate("/")}
    >
      <span className="brand-mark" aria-hidden="true">J</span>
      <span className="brand-copy">
        JRVX
        {!compact && <small>Личный планировщик</small>}
      </span>
    </button>
  );
}
