'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

export type GooglePlace = {
  address_components?: Array<{ long_name: string; short_name: string; types: string[] }>
  formatted_address?: string
  name?: string
}

type Props = {
  apiKey?: string
  value: string
  onValueChange: (v: string) => void
  onPick: (place: GooglePlace, description?: string) => void
  /** ISO 3166-1 alpha-2 codes to restrict results to (e.g. ['de']). Null = no restriction. */
  countries?: string[] | null
  /**
   * City names to restrict predictions to WITHIN the country (e.g. ['Dubai', 'Abu Dhabi'] for the
   * UAE, where we only serve those two emirates). Google's componentRestrictions can only filter by
   * country, not city, so we filter the predictions ourselves: a prediction is kept only when its
   * description mentions one of these cities. Null/empty = no city restriction. Case-insensitive.
   */
  allowedCities?: string[] | null
  language?: string
  id?: string
  placeholder?: string
  className?: string
  autoComplete?: string
}

/**
 * Google Places address autocomplete (ported from frontend-web's GoogleAddressAutocomplete).
 * Restricts predictions to `countries` via componentRestrictions, calls onPick(place) with the
 * resolved place details on selection. Loads the Maps Places script on demand.
 */
export default function AddressAutocomplete({
  apiKey,
  value,
  onValueChange,
  onPick,
  countries = null,
  allowedCities = null,
  language,
  id,
  placeholder,
  className,
  autoComplete = 'new-password',
}: Props) {
  const googleLang = useMemo(() => {
    const lang = (language || 'en').toLowerCase()
    if (lang.startsWith('de')) return 'de'
    if (lang.startsWith('fr')) return 'fr'
    if (lang.startsWith('nl')) return 'nl'
    return 'en'
  }, [language])

  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(false)
  const [predictions, setPredictions] = useState<any[]>([])
  const [loadingPred, setLoadingPred] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const acServiceRef = useRef<any>(null)
  const placesServiceRef = useRef<any>(null)
  const sessionTokenRef = useRef<any>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load the Google Maps Places script once.
  useEffect(() => {
    if (!apiKey) return
    const w = window as any
    const scriptId = 'google-maps-places'
    const markReady = () => {
      if (w.google?.maps?.places) setReady(true)
    }
    let script = document.getElementById(scriptId) as HTMLScriptElement | null
    if (script) {
      markReady()
      if (!w.google?.maps?.places) {
        const onLoad = () => markReady()
        script.addEventListener('load', onLoad)
        return () => script?.removeEventListener('load', onLoad)
      }
      return
    }
    const params = new URLSearchParams({ key: apiKey, libraries: 'places', language: googleLang })
    script = document.createElement('script')
    script.id = scriptId
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`
    script.async = true
    script.defer = true
    const onLoad = () => markReady()
    script.addEventListener('load', onLoad)
    document.body.appendChild(script)
    return () => script?.removeEventListener('load', onLoad)
  }, [apiKey, googleLang])

  // Init the autocomplete + places services once the script is ready.
  useEffect(() => {
    const w = window as any
    if (!ready || !w.google?.maps?.places) return
    acServiceRef.current = new w.google.maps.places.AutocompleteService()
    placesServiceRef.current = new w.google.maps.places.PlacesService(document.createElement('div'))
    sessionTokenRef.current = new w.google.maps.places.AutocompleteSessionToken()
  }, [ready])

  // Close the dropdown on outside click.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const fetchPredictions = (text: string) => {
    const w = window as any
    if (!acServiceRef.current) return
    const input = (text || '').trim()
    if (!input) {
      setPredictions([])
      setOpen(false)
      return
    }
    setLoadingPred(true)
    const request: any = {
      input,
      types: ['address'],
      sessionToken: sessionTokenRef.current || undefined,
    }
    if (countries && countries.length > 0) {
      request.componentRestrictions = { country: countries }
    }
    acServiceRef.current.getPlacePredictions(request, (preds: any, status: any) => {
      setLoadingPred(false)
      if (status !== w.google.maps.places.PlacesServiceStatus.OK || !Array.isArray(preds)) {
        setPredictions([])
        setOpen(false)
        return
      }
      // Google can only restrict by country, so drop predictions from cities we don't serve (e.g.
      // for the UAE keep only Dubai / Abu Dhabi, hiding Sharjah and the other emirates).
      let list = preds
      if (allowedCities && allowedCities.length > 0) {
        const wanted = allowedCities.map((c) => c.toLowerCase())
        list = preds.filter((p: any) =>
          wanted.some((c) => (p?.description || '').toLowerCase().includes(c)),
        )
      }
      setPredictions(list)
      setOpen(true)
    })
  }

  const onChangeInput = (txt: string) => {
    onValueChange(txt)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchPredictions(txt), 200)
  }

  const pickPrediction = (pred: any) => {
    const w = window as any
    if (!pred?.place_id || !placesServiceRef.current) return
    onValueChange(pred.description || value)
    setOpen(false)
    setPredictions([])
    placesServiceRef.current.getDetails(
      {
        placeId: pred.place_id,
        fields: ['address_components', 'formatted_address', 'geometry', 'name', 'types'],
        sessionToken: sessionTokenRef.current || undefined,
      },
      (place: any, status: any) => {
        if (status !== w.google.maps.places.PlacesServiceStatus.OK || !place) return
        onPick(place, pred.description)
        sessionTokenRef.current = new w.google.maps.places.AutocompleteSessionToken()
      },
    )
  }

  return (
    <div ref={rootRef} style={{ position: 'relative', width: '100%' }}>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        className={className}
        autoComplete={autoComplete}
        lang={googleLang}
        onChange={(e) => onChangeInput(e.target.value)}
        onFocus={() => {
          if (predictions.length > 0) setOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.preventDefault()
          if (e.key === 'Escape') setOpen(false)
        }}
      />

      {open && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 'calc(100% + 6px)',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            boxShadow: '0 10px 24px rgba(0,0,0,0.10)',
            zIndex: 60,
            overflow: 'hidden',
          }}
        >
          {loadingPred && (
            <div style={{ padding: '10px 14px', fontSize: 14, color: 'rgba(18,49,77,0.55)', fontFamily: "'Inter', sans-serif" }}>…</div>
          )}
          {!loadingPred && predictions.length === 0 && (
            <div style={{ padding: '10px 14px', fontSize: 14, color: 'rgba(18,49,77,0.55)', fontFamily: "'Inter', sans-serif" }}>No results</div>
          )}
          {!loadingPred &&
            predictions.map((p) => (
              <button
                key={p.place_id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickPrediction(p)}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f4f7fa')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '11px 14px',
                  fontSize: 15,
                  color: '#12314d',
                  fontFamily: "'Inter', sans-serif",
                  background: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {p.description}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
