import { put, type PutBlobResult } from '@vercel/blob'

type UploadAccess = 'public' // vercel blob currently only supports public...

export type UploadFileOptions = {
    access?: UploadAccess
    contentType?: string
    addRandomSuffix?: boolean
    token?: string
}

export async function uploadFile(
    pathname: string,
    body: Blob | File | ArrayBuffer | ReadableStream<Uint8Array> | string,
    options: UploadFileOptions = {}
): Promise<PutBlobResult> {
    const { access = 'public', contentType, addRandomSuffix, token } = options

    const result = await put(pathname, body, {
        access,
        contentType,
        addRandomSuffix,
        token,
    })

    return result
}
