import { useCallback, useState } from 'react'
import { MOCK_RECRUIT } from '../mocks/recruit'
import { RecruitContext } from './RecruitContext'

// Single source of truth for the booth-recruitment announcement. The recruit page edits it and
// the dashboard reads its status, so both always agree. (The deadline and target count are on
// the Event: see EventProvider.)
//
// TODO(backend): replace MOCK_RECRUIT with the fetched Recruitment and call the API inside each
// action (see "Where to connect" in BACKEND_INTEGRATION.md).
export default function RecruitProvider({ children }) {
  const [recruit, setRecruit] = useState(MOCK_RECRUIT)

  // fields: any subset of { intro, imageUrl, categories, feeInfo, documents, contact }.
  // TODO(backend): PUT /recruitment.
  const updateRecruit = useCallback((fields) => {
    setRecruit((prev) => ({ ...prev, ...fields }))
  }, [])

  // Opens (true) or closes (false) the announcement to booth operators.
  // TODO(backend): PATCH /recruitment/publish { published }.
  const setPublished = useCallback((published) => {
    setRecruit((prev) => ({ ...prev, published }))
  }, [])

  return (
    <RecruitContext.Provider value={{ recruit, updateRecruit, setPublished }}>
      {children}
    </RecruitContext.Provider>
  )
}
