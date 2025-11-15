import axios from 'axios'
import FormData from 'form-data'

export interface IPFSUploadResult {
  ipfsHash: string
  ipfsUrl: string
}

export async function uploadToIPFS(file: Buffer, fileName: string): Promise<IPFSUploadResult> {
  const apiKey = process.env.PINATA_API_KEY
  const apiSecret = process.env.PINATA_API_SECRET
  const jwt = process.env.PINATA_JWT
  
  if (!apiKey || !apiSecret) {
    throw new Error('Pinata credentials not configured')
  }
  
  try {
    // Create FormData using form-data package for Node.js
    const formData = new FormData()
    
    formData.append('file', file, {
      filename: fileName,
      contentType: 'application/octet-stream'
    })
    
    const metadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        uploadedAt: new Date().toISOString()
      }
    })
    formData.append('pinataMetadata', metadata)
    
    const pinataOptions = JSON.stringify({
      cidVersion: 1
    })
    formData.append('pinataOptions', pinataOptions)
    
    // Upload to Pinata
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          pinata_api_key: apiKey,
          pinata_secret_api_key: apiSecret
        }
      }
    )
    
    const ipfsHash = response.data.IpfsHash
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
    
    return {
      ipfsHash,
      ipfsUrl
    }
  } catch (error) {
    console.error('Error uploading to IPFS:', error)
    throw error
  }
}

export async function retrieveFromIPFS(ipfsHash: string): Promise<Buffer> {
  try {
    const response = await axios.get(
      `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      { responseType: 'arraybuffer' }
    )
    
    return Buffer.from(response.data)
  } catch (error) {
    console.error('Error retrieving from IPFS:', error)
    throw error
  }
}

