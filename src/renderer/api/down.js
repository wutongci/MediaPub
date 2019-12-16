import request from '@/utils/request.js'

export function download (url) {
  return request.get('/down', {
    params: {
      url
    }
  })
}
