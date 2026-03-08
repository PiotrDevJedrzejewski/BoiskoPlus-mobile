import customFetch from './customFetch'

export const fetchEventsCollections = async () => {
  const [ownerResponse, participantResponse] = await Promise.all([
    customFetch.get('/football-events'),
    customFetch.get('/status/my-events'),
  ])

  return {
    ownerEvents: ownerResponse?.data?.events || [],
    userEvents: participantResponse?.data?.userEvents || [],
  }
}

export const parseEventDate = (event) => {
  if (!event) return new Date(0)

  if (event.startDateTime) {
    const parsed = new Date(event.startDateTime)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }

  if (event.startDate && event.startHour) {
    const parsed = new Date(`${event.startDate}T${event.startHour}`)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }

  return new Date(0)
}