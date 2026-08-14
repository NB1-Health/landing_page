import React from 'react'

export function KlaviyoPreviewStandIn() {
  return (
    <div
      aria-disabled="true"
      aria-label="Klaviyo form disabled in draft preview"
      className="nb1-klaviyo-preview-standin"
      role="group"
    >
      <span aria-hidden="true" className="nb1-klaviyo-preview-standin__field" />
      <span aria-hidden="true" className="nb1-klaviyo-preview-standin__button" />
      <span className="nb1-klaviyo-preview-standin__label">
        Preview only — external Klaviyo form disabled
      </span>
    </div>
  )
}
