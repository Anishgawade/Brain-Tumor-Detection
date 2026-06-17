// import axios from 'axios'

// const api = axios.create({
//   baseURL: '/api',
//   timeout: 120000, // Model inference can take a while
// })

// api.interceptors.response.use(
//   (res) => res,
//   (err) => {
//     const message =
//       err.response?.data?.detail ||
//       err.response?.data?.message ||
//       err.message ||
//       'An unexpected error occurred'
//     return Promise.reject(new Error(message))
//   }
// )

// export const predictImage = (file, onUploadProgress) => {
//   const form = new FormData()
//   form.append('file', file)
//   return api.post('/predict', form, {
//     headers: { 'Content-Type': 'multipart/form-data' },
//     onUploadProgress,
//   })
// }

// export const fetchStats = () => api.get('/stats')
// export const fetchHistory = (limit = 50) => api.get(`/history?limit=${limit}`)

// /** Optional: Provide a payload containing image data and prediction details, receiving a PDF blob in return. */
// export const exportReport = (data) => api.post('/export', data, { responseType: 'blob' })
// export const exportTimelineReport = (data) => api.post('/export-timeline', data, { responseType: 'blob' })
// export const fetchHealth = () => api.get('/health')

// export default api

import axios from 'axios'

const API_URL =
import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
baseURL: `${API_URL}/api`,
timeout: 120000,
})

api.interceptors.response.use(
(res) => res,
(err) => {
const message =
err.response?.data?.detail ||
err.response?.data?.message ||
err.message ||
'An unexpected error occurred'
return Promise.reject(new Error(message))
}
)

export const predictImage = (file, onUploadProgress) => {
const form = new FormData()
form.append('file', file)
return api.post('/predict', form, {
headers: { 'Content-Type': 'multipart/form-data' },
onUploadProgress,
})
}

export const fetchStats = () => api.get('/stats')
export const fetchHistory = (limit = 50) => api.get(`/history?limit=${limit}`)
export const exportReport = (data) => api.post('/export', data, { responseType: 'blob' })
export const exportTimelineReport = (data) => api.post('/export-timeline', data, { responseType: 'blob' })
export const fetchHealth = () => api.get('/health')

export default api
