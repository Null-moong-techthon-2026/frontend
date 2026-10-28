import { useCallback, useMemo, useState } from 'react'
import { uploadImage } from '../api/eventApi'
import * as mapApi from '../api/mapApi'
import { PIN_TYPE } from '../constants/map'
import { MapContext } from './MapContext'
import { useEvent } from './useEvent'
import { useEventData } from './useEventData'

// Single source of truth for the event map: the draft floor plan being edited and the pins on it.
// 지도 제작 edits it; the published map (what visitors see) only changes through publish().
//
//   image      null | { url, name, width, height }   width/height = pixels of the image file
//   pins       { id, type, label, boothId, x, y }[]  x/y are pixels of the ORIGINAL image; boothId is
//                                                    the event booth (null for facilities)
//   draft      null | { floorPlanId, revision, versionNo }   the editable map
//   published  null | { floorPlanId, versionNo }            the map visitors currently see
//   dirty      true when pins were edited and not saved yet
//   loading, error, reload
//
//   setPins(updater)         edits the pins (a new array or an updater function); marks them dirty
//   uploadFloorPlan(file)    uploads the image and starts a new draft with it
//   startFromPublished()     starts a draft that is a copy of the published map (image + pins)
//   savePins()               saves the whole pin set of the draft
//   publish()                saves, then publishes the draft; the old published map is archived
//   discardDraft()           deletes the draft with its pins
// All of them throw ApiError when the backend refuses (REVISION_CONFLICT, INVALID_STATE, ...).
//
// The backend stores pin positions as 0..1 ratios of the image; the screens work in pixels of the
// original image, so this provider converts in both directions.
const ratio = (value, size) => Number(Math.min(1, Math.max(0, value / size)).toFixed(7))

// Pins in pixels -> the PUT body (the complete pin set; booth ids only on booth pins).
const toPinRequests = (pins, { width, height }) =>
  pins.map((p) => ({
    id: p.id,
    pinType: p.type,
    label: p.label || '핀',
    xRatio: ratio(p.x, width),
    yRatio: ratio(p.y, height),
    ...(p.type === PIN_TYPE.BOOTH && p.boothId ? { eventBoothId: p.boothId } : {}),
  }))

export default function MapProvider({ children }) {
  const { event } = useEvent()
  const eventId = event?.id ?? null
  const { data, loading, error, reload, setData } = useEventData(eventId, mapApi.getMapEditor)
  const [names, setNames] = useState({}) // floorPlanId -> uploaded file name (not stored by the backend)
  const [edit, setEdit] = useState(null) // { base, pins } while there are unsaved pin edits

  const draftMap = data?.draftMap ?? null
  const publishedMap = data?.publishedMap ?? null
  const base = draftMap ? `${draftMap.floorPlanId}:${draftMap.revision}` : null

  const image = useMemo(
    () =>
      draftMap && {
        url: draftMap.image.readUrl,
        name: names[draftMap.floorPlanId] ?? `평면도 v${draftMap.versionNo}`,
        width: draftMap.image.widthPx,
        height: draftMap.image.heightPx,
      },
    [draftMap, names],
  )

  const savedPins = useMemo(
    () =>
      draftMap
        ? draftMap.pins.map((p) => ({
            id: p.id,
            type: p.pinType,
            label: p.label,
            boothId: p.eventBoothId ?? null,
            x: Math.round(Number(p.xRatio) * draftMap.image.widthPx),
            y: Math.round(Number(p.yRatio) * draftMap.image.heightPx),
          }))
        : [],
    [draftMap],
  )

  const dirty = edit !== null && edit.base === base
  const pins = dirty ? edit.pins : savedPins

  const setPins = useCallback(
    (updater) =>
      setEdit((prev) => {
        const current = prev && prev.base === base ? prev.pins : savedPins
        return { base, pins: typeof updater === 'function' ? updater(current) : updater }
      }),
    [base, savedPins],
  )

  const draft = useMemo(
    () =>
      draftMap && {
        floorPlanId: draftMap.floorPlanId,
        revision: draftMap.revision,
        versionNo: draftMap.versionNo,
      },
    [draftMap],
  )
  const published = useMemo(
    () => publishedMap && { floorPlanId: publishedMap.floorPlanId, versionNo: publishedMap.versionNo },
    [publishedMap],
  )

  const uploadFloorPlan = useCallback(
    async (file) => {
      const asset = await uploadImage(eventId, file)
      const plan = await mapApi.createFloorPlan(eventId, { mediaAssetId: asset.mediaAssetId })
      setNames((prev) => ({ ...prev, [plan.floorPlanId]: file.name }))
      setData((prev) => ({ ...prev, draftMap: plan }))
    },
    [eventId, setData],
  )

  const startFromPublished = useCallback(async () => {
    const plan = await mapApi.createFloorPlan(eventId, {
      sourceFloorPlanId: publishedMap.floorPlanId,
    })
    setData((prev) => ({ ...prev, draftMap: plan }))
  }, [eventId, publishedMap, setData])

  // Saves the whole pin set; resolves with the saved draft map.
  const savePins = useCallback(async () => {
    const plan = await mapApi.replacePins(
      eventId,
      draftMap.floorPlanId,
      draftMap.revision,
      toPinRequests(pins, image),
    )
    setData((prev) => ({ ...prev, draftMap: plan }))
    setEdit(null)
    return plan
  }, [eventId, draftMap, image, pins, setData])

  const publish = useCallback(async () => {
    const plan = dirty ? await savePins() : draftMap
    await mapApi.publishFloorPlan(eventId, plan.floorPlanId, plan.revision)
    await reload()
  }, [eventId, dirty, draftMap, savePins, reload])

  const discardDraft = useCallback(async () => {
    await mapApi.deleteFloorPlan(eventId, draftMap.floorPlanId, draftMap.revision)
    setEdit(null)
    await reload()
  }, [eventId, draftMap, reload])

  const value = useMemo(
    () => ({
      image,
      pins,
      setPins,
      draft,
      published,
      dirty,
      loading,
      error,
      reload,
      uploadFloorPlan,
      startFromPublished,
      savePins,
      publish,
      discardDraft,
    }),
    [image, pins, setPins, draft, published, dirty, loading, error, reload, uploadFloorPlan, startFromPublished, savePins, publish, discardDraft],
  )
  return <MapContext.Provider value={value}>{children}</MapContext.Provider>
}
