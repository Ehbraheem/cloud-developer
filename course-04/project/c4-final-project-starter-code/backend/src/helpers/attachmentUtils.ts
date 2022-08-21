import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

// TODO: Implement the fileStogare logic

class FileStorage {
  constructor(
    private readonly s3: AWS.S3 = new XAWS.S3({ signatureVersion: 'v4' }),
    private readonly bucketName = process.env.FILE_BUCKET,
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION
  ) {}

  async uploadFile(fileName: string, fileStream: any): Promise<string> {
    const uploadParams = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: fileStream
    }

    await this.s3.upload(uploadParams).promise()

    return this.getUploadUrl(fileName)
  }
  async getUploadUrl(fileName: string): Promise<string> {
    const uploadUrl = this.s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: fileName,
      Expires: parseInt(this.urlExpiration)
    })

    return uploadUrl
  }
}

export class AttachmentUtils {
  constructor(private readonly fileStorage: FileStorage = new FileStorage()) {}

  async uploadFile(fileName: string, fileStream: any): Promise<string> {
    return this.fileStorage.uploadFile(fileName, fileStream)
  }

  async getUploadUrl(fileName: string): Promise<string> {
    return this.fileStorage.getUploadUrl(fileName)
  }
}
