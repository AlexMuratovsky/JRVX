import React from "react";

export default function Panel({ title, action, children, className = "" }) {
  return (
    <section className={["panel", className].filter(Boolean).join(" ")}>
      {(title || action) && (
        <div className="section-heading">
          {title && <h2>{title}</h2>}
          {action}
        </div>
      )}
      <div className="panel-body">{children}</div>
    </section>
  );
}
