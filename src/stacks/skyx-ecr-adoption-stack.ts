import * as cdk from "aws-cdk-lib";
import * as ecr from "aws-cdk-lib/aws-ecr";
import { Construct } from "constructs";

export const ecrAdoptionRepositoryNames = [
  "skyx-backend",
  "skyx-frontend",
] as const;

export type EcrAdoptionRepositoryName =
  (typeof ecrAdoptionRepositoryNames)[number];

export interface SkyxEcrAdoptionStackProps extends cdk.StackProps {
  repositoryName: EcrAdoptionRepositoryName;
}

export class SkyxEcrAdoptionStack extends cdk.Stack {
  public constructor(
    scope: Construct,
    id: string,
    props: SkyxEcrAdoptionStackProps,
  ) {
    super(scope, id, props);

    const repository = new ecr.CfnRepository(this, "Repository", {
      repositoryName: props.repositoryName,
      imageTagMutability: "MUTABLE",
      imageScanningConfiguration: {
        scanOnPush: true,
      },
      encryptionConfiguration: {
        encryptionType: "AES256",
      },
    });

    repository.cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.RETAIN;
    repository.cfnOptions.updateReplacePolicy = cdk.CfnDeletionPolicy.RETAIN;

    new cdk.CfnOutput(this, "RepositoryName", {
      value: props.repositoryName,
      description: "The existing ECR repository selected for staged adoption.",
    });
    new cdk.CfnOutput(this, "RepositoryArn", {
      value: this.formatArn({
        service: "ecr",
        resource: "repository",
        resourceName: props.repositoryName,
      }),
      description: "The ECR repository ARN for the selected adoption target.",
    });
  }
}
