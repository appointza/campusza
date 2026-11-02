
using Microsoft.Extensions.Options;
using Campusza.Services;
using Campusza.Utils;
using Amazon.S3;
using Amazon;
using Amazon.S3.Model;
using System.IO;

namespace Campusza.AwsS3
{
    public class AwsS3Service
    {
        string accesskey;
        string secretaccesskey;
        string endpoint;
        string bucketname;
        string path;
        ILogger<AwsS3Service> logger;
        AmazonS3Client s3client = null;
        public bool IsEnabled => s3client != null;
        public AwsS3Service(ILogger<AwsS3Service> logger, IOptions<ApplicationEnvironment> applicationenvironment)
        {

            accesskey = applicationenvironment.Value.awss3config.accesskey;
            secretaccesskey = applicationenvironment.Value.awss3config.secretaccesskey;
            endpoint = applicationenvironment.Value.awss3config.endpoint;
            bucketname = applicationenvironment.Value.awss3config.bucketname;
            path = applicationenvironment.Value.awss3config.path;
            this.logger = logger;
            if (applicationenvironment.Value.awss3config.iss3enabled)
            {
                var regionEndpoint = RegionEndpoint.GetBySystemName(endpoint);
                s3client = new AmazonS3Client(accesskey, secretaccesskey, regionEndpoint);
            }
        }
        public async Task<bool> DeleteObj(string name)
        {
            string key = path + "/" + name;
            return await Delete(key);
        }
        public async Task<bool> Delete(string key)
        {
            var req =
            new DeleteObjectRequest
            {
                BucketName = bucketname,
                Key = key
            };

            await s3client.DeleteObjectAsync(req);
            return true;
        }

        public async Task<byte[]> GetObj(string name)
        {
            string key = path + "/" + name;
            return await GetData(key);
        }
        public async Task<byte[]> GetData(string key)
        {
            var req =
                new GetObjectRequest
                {
                    BucketName = bucketname,
                    Key = key
                };

            GetObjectResponse res = await s3client.GetObjectAsync(req);

            using (
                MemoryStream memoryStream =
                    new MemoryStream()
            )
            {
                res.ResponseStream.CopyTo(memoryStream);
                return memoryStream.ToArray();
            }

            return null;
        }
        public async Task<bool> WriteObj(string name, byte[] data)
        {
            string key = path + "/" + name;
            return await WriteData(key, data);
        }

        public async Task<bool> WriteData(string key, byte[] data)
        {

            //S3DirectoryInfo di =
            //    new S3DirectoryInfo(s3Client,
            //        credential.bucketname,
            //        credential.path);
            //if (!di.Exists)
            //{
            //    di.Create();
            //}

            using (var stream = new System.IO.MemoryStream(data))
            {
                var req =
                    new PutObjectRequest
                    {
                        BucketName = bucketname,
                        Key = key,
                        InputStream = stream
                    };

                PutObjectResponse res = await s3client.PutObjectAsync(req);
                return true;
            }
        }
        public async Task CreateFoldersAsync(string bucketName, string path)
        {

            // path should end with 

            IAmazonS3 client =
                new AmazonS3Client(accesskey, secretaccesskey,
                 RegionEndpoint.GetBySystemName(endpoint));

            var findFolderRequest = new ListObjectsV2Request();
            findFolderRequest.BucketName = bucketName;
            findFolderRequest.Prefix = path;
            findFolderRequest.MaxKeys = 1;

            ListObjectsV2Response findFolderResponse =
               await client.ListObjectsV2Async(findFolderRequest);


            if (findFolderResponse.S3Objects.Any())
            {
                return;
            }

            PutObjectRequest request = new PutObjectRequest()
            {
                BucketName = bucketName,
                StorageClass = S3StorageClass.Standard,
                ServerSideEncryptionMethod = ServerSideEncryptionMethod.None,
                Key = path,
                ContentBody = string.Empty
            };

            // add try catch in case you have exceptions shield/handling here 
            PutObjectResponse response = await client.PutObjectAsync(request);
        }
    }
}
