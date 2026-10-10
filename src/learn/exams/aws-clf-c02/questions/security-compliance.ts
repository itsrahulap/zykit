import type { ExamQuestion } from '../../types';

export const securityComplianceQuestions: ExamQuestion[] = [
  {
    id: 'sec-001',
    domain: 'security-compliance',
    question:
      'A company runs its application on Amazon EC2 instances. Under the AWS shared responsibility model, which task is the responsibility of the company?',
    options: [
      'Patching the guest operating system on the instances',
      'Maintaining the physical hosts that run the instances',
      'Securing the data center facilities that house the hosts',
      'Replacing failed storage hardware in the data centers',
    ],
    answer: [0],
    explanation:
      'With EC2 (infrastructure as a service), the customer manages the **guest operating system**, including updates and security patches. Physical hosts, data center facilities and hardware replacement are all part of the infrastructure that AWS secures ("security **of** the cloud").',
  },
  {
    id: 'sec-002',
    domain: 'security-compliance',
    question:
      'A company moves its self-managed database from Amazon EC2 to Amazon RDS. Which task does AWS now take on for the company?',
    options: [
      'Creating and managing the database user accounts',
      'Applying operating system patches to the underlying database host',
      'Configuring security group rules that control access to the database',
      'Deciding whether the database storage should be encrypted',
    ],
    answer: [1],
    explanation:
      'Amazon RDS is a managed service, so AWS handles the **underlying operating system and database software patching** (applied during a maintenance window the customer can choose). The customer still manages database users, security group rules, and the choice to enable encryption.',
  },
  {
    id: 'sec-003',
    domain: 'security-compliance',
    question:
      'A team builds a serverless application with AWS Lambda. Which of the following is the responsibility of the team under the shared responsibility model?',
    options: [
      'Patching the operating system of the execution environment',
      'Scaling the fleet of servers that run the functions',
      'Writing secure function code and managing its IAM permissions',
      'Maintaining the virtualization layer that isolates functions',
    ],
    answer: [2],
    explanation:
      'With Lambda, the customer is responsible for **their function code, the data it handles, and the IAM permissions** (such as the execution role). AWS manages the operating system, the underlying server fleet and its scaling, and the virtualization layer.',
  },
  {
    id: 'sec-004',
    domain: 'security-compliance',
    question:
      "A compliance officer needs to download AWS's SOC 2 report to give to an external auditor. Which AWS service provides this report?",
    options: ['AWS Audit Manager', 'AWS Config', 'AWS Security Hub', 'AWS Artifact'],
    answer: [3],
    explanation:
      "**AWS Artifact** is the self-service portal for on-demand access to AWS's own compliance reports (such as SOC and ISO reports) and agreements. Audit Manager collects evidence about the customer's own resources, AWS Config tracks resource configurations, and Security Hub aggregates security findings.",
  },
  {
    id: 'sec-005',
    domain: 'security-compliance',
    question:
      'Which of the following are responsibilities of AWS under the shared responsibility model? (Choose two.)',
    options: [
      'Physical security of AWS data centers',
      'Configuring security group rules for EC2 instances',
      'Maintaining the global network infrastructure that runs AWS services',
      'Creating IAM users and assigning their permissions',
      'Classifying and protecting sensitive customer data',
    ],
    answer: [0, 2],
    explanation:
      'AWS is responsible for security **of** the cloud: the **physical data centers** and the **hardware, software and networking infrastructure** that run AWS services. Security group rules, IAM users and permissions, and data classification are customer responsibilities (security **in** the cloud).',
  },
  {
    id: 'sec-006',
    domain: 'security-compliance',
    question:
      'A security team needs to find out which IAM user terminated an Amazon EC2 instance yesterday. Which AWS service should the team use?',
    options: ['AWS CloudTrail', 'Amazon CloudWatch', 'AWS Config', 'Amazon Inspector'],
    answer: [0],
    explanation:
      '**AWS CloudTrail** records API calls made in an account, including who made the call, when, and from where, so it answers "who did what". CloudWatch collects metrics and logs for monitoring, AWS Config records resource configuration state, and Inspector scans for software vulnerabilities.',
  },
  {
    id: 'sec-007',
    domain: 'security-compliance',
    question:
      'A company wants to see how the rules of a security group have changed over time and to evaluate whether its resources comply with internal configuration rules. Which AWS service meets these requirements?',
    options: ['AWS CloudTrail', 'AWS Config', 'Amazon CloudWatch', 'AWS Trusted Advisor'],
    answer: [1],
    explanation:
      '**AWS Config** records resource configuration history and evaluates resources against **Config rules** for compliance. CloudTrail records the API calls that made changes but does not evaluate compliance, CloudWatch is for metrics, logs and alarms, and Trusted Advisor gives general best-practice recommendations.',
  },
  {
    id: 'sec-008',
    domain: 'security-compliance',
    question:
      'A company wants to collect application log files from its servers and be alerted when the number of failed login messages in those logs exceeds a threshold. Which AWS service should it use?',
    options: ['AWS Config', 'AWS CloudTrail', 'Amazon CloudWatch', 'Amazon Detective'],
    answer: [2],
    explanation:
      '**Amazon CloudWatch** can collect application logs in CloudWatch Logs, turn log patterns into metrics with metric filters, and trigger **alarms** on thresholds. AWS Config tracks resource configurations, CloudTrail records AWS API calls rather than application logs, and Detective is used to investigate security findings.',
  },
  {
    id: 'sec-009',
    domain: 'security-compliance',
    question:
      'Which AWS service provides intelligent threat detection by continuously analyzing sources such as AWS CloudTrail events, VPC Flow Logs, and DNS logs to identify activity such as cryptocurrency mining or compromised credentials?',
    options: ['Amazon Inspector', 'Amazon Macie', 'Amazon Detective', 'Amazon GuardDuty'],
    answer: [3],
    explanation:
      '**Amazon GuardDuty** is a threat detection service that analyzes CloudTrail, VPC Flow Logs and DNS logs (plus other optional sources) to find malicious or unauthorized activity. Inspector scans for software vulnerabilities, Macie discovers sensitive data in S3, and Detective helps investigate the root cause of findings.',
  },
  {
    id: 'sec-010',
    domain: 'security-compliance',
    question: 'Which statements about security groups are correct? (Choose two.)',
    options: [
      'They support both allow rules and deny rules',
      'They are stateful, so return traffic for an allowed request is automatically allowed',
      'They are associated with subnets and apply to every resource in the subnet',
      'They act as a virtual firewall at the instance (network interface) level',
      'Their rules are evaluated in number order, starting with the lowest number',
    ],
    answer: [1, 3],
    explanation:
      'Security groups are **stateful** and act as a **virtual firewall for instances** (attached to network interfaces). They support **allow rules only**, and all rules are evaluated together; numbered rule order and subnet-level association are characteristics of network ACLs.',
  },
  {
    id: 'sec-011',
    domain: 'security-compliance',
    question:
      'A company wants to automatically and continuously scan its Amazon EC2 instances and container images in Amazon ECR for known software vulnerabilities. Which AWS service should it use?',
    options: ['Amazon Inspector', 'Amazon GuardDuty', 'AWS Shield', 'Amazon Macie'],
    answer: [0],
    explanation:
      '**Amazon Inspector** is an automated vulnerability management service that scans EC2 instances, ECR container images and Lambda functions for software vulnerabilities (CVEs) and unintended network exposure. GuardDuty detects threats from activity, Shield protects against DDoS, and Macie finds sensitive data in S3.',
  },
  {
    id: 'sec-012',
    domain: 'security-compliance',
    question:
      'A company needs to discover which of its Amazon S3 buckets contain personally identifiable information (PII), such as names and credit card numbers. Which AWS service should it use?',
    options: ['Amazon GuardDuty', 'Amazon Macie', 'Amazon Inspector', 'AWS Config'],
    answer: [1],
    explanation:
      '**Amazon Macie** uses machine learning and pattern matching to discover and report **sensitive data such as PII** in Amazon S3. GuardDuty detects threats, Inspector scans workloads for vulnerabilities, and AWS Config tracks resource configurations but does not inspect object contents.',
  },
  {
    id: 'sec-013',
    domain: 'security-compliance',
    question:
      'Amazon GuardDuty raised a finding about suspicious activity. A security analyst now wants to investigate the root cause by visualizing the relationships between the involved IAM users, IP addresses, and resources over time. Which AWS service should the analyst use?',
    options: ['Amazon Inspector', 'AWS Security Hub', 'Amazon Detective', 'Amazon Macie'],
    answer: [2],
    explanation:
      '**Amazon Detective** automatically builds a behavior graph from log data so analysts can **investigate** findings and identify their root cause. Inspector finds vulnerabilities, Security Hub aggregates findings and runs best-practice checks but is not an investigation tool, and Macie discovers sensitive data.',
  },
  {
    id: 'sec-014',
    domain: 'security-compliance',
    question:
      'A company wants a single place to view and prioritize security findings from Amazon GuardDuty, Amazon Inspector, and Amazon Macie across its accounts, and to run automated security best-practice checks. Which AWS service meets these requirements?',
    options: ['Amazon Detective', 'AWS Trusted Advisor', 'AWS Config', 'AWS Security Hub'],
    answer: [3],
    explanation:
      '**AWS Security Hub** aggregates and prioritizes findings from AWS security services and partner tools and runs automated checks against security standards. Detective is for investigating findings, Trusted Advisor gives general recommendations, and AWS Config evaluates resource configurations but is not a findings aggregator.',
  },
  {
    id: 'sec-015',
    domain: 'security-compliance',
    question: 'Which statements about network access control lists (network ACLs) are correct? (Choose two.)',
    options: [
      'They are stateful, so return traffic is automatically allowed',
      'They are attached directly to individual EC2 instances',
      'They are stateless, so return traffic must be explicitly allowed',
      'They support allow rules only',
      'They support both allow rules and deny rules',
    ],
    answer: [2, 4],
    explanation:
      'Network ACLs operate at the **subnet** level, are **stateless** (inbound and outbound traffic are evaluated separately), and support **both allow and deny** rules. Being stateful, attaching to instances, and supporting allow rules only are characteristics of security groups.',
  },
  {
    id: 'sec-016',
    domain: 'security-compliance',
    question:
      'A startup wants protection against the most common network and transport layer DDoS attacks on its AWS resources without paying anything extra or enabling anything. Which option provides this?',
    options: ['AWS Shield Standard', 'AWS Shield Advanced', 'AWS WAF', 'Amazon GuardDuty'],
    answer: [0],
    explanation:
      '**AWS Shield Standard** is automatically enabled for all AWS customers at no additional charge and protects against common layer 3 and layer 4 DDoS attacks. Shield Advanced is a paid subscription, AWS WAF filters web requests and is billed separately, and GuardDuty is a threat detection service.',
  },
  {
    id: 'sec-017',
    domain: 'security-compliance',
    question:
      'A web application behind an Application Load Balancer is receiving SQL injection and cross-site scripting (XSS) attempts. Which AWS service can block these requests?',
    options: ['AWS Shield Standard', 'AWS WAF', 'Network ACLs', 'Amazon Inspector'],
    answer: [1],
    explanation:
      '**AWS WAF** is a web application firewall that inspects HTTP(S) requests at layer 7 and can block common exploits such as **SQL injection and XSS**. Shield Standard protects against network-layer DDoS, network ACLs filter by IP, protocol and port only, and Inspector finds vulnerabilities but does not block traffic.',
  },
  {
    id: 'sec-018',
    domain: 'security-compliance',
    question:
      'A company runs a high-profile website and wants 24/7 access to the AWS Shield Response Team and protection against unexpected scaling charges caused by DDoS attacks. Which service should it subscribe to?',
    options: ['AWS Shield Standard', 'AWS WAF', 'AWS Shield Advanced', 'AWS Firewall Manager'],
    answer: [2],
    explanation:
      '**AWS Shield Advanced** is a paid service that adds enhanced DDoS detection, access to the **Shield Response Team (SRT)**, and **DDoS cost protection**. Shield Standard has no SRT access or cost protection, WAF filters web requests, and Firewall Manager centrally manages firewall policies.',
  },
  {
    id: 'sec-019',
    domain: 'security-compliance',
    question:
      'A company with dozens of accounts in AWS Organizations wants to centrally configure and enforce AWS WAF rules across all accounts, including accounts created in the future. Which AWS service should it use?',
    options: ['AWS Security Hub', 'AWS Config', 'AWS Shield Standard', 'AWS Firewall Manager'],
    answer: [3],
    explanation:
      '**AWS Firewall Manager** centrally configures and manages firewall rules (AWS WAF, Shield Advanced protections, security groups, AWS Network Firewall and more) across accounts in an organization, and applies them to new accounts and resources automatically. Security Hub aggregates findings, AWS Config evaluates configurations, and Shield Standard is basic DDoS protection.',
  },
  {
    id: 'sec-020',
    domain: 'security-compliance',
    question:
      'Which of the following tasks can be performed only by the AWS account root user? (Choose two.)',
    options: [
      'Close the AWS account',
      'Create a new IAM user group',
      'Launch an EC2 instance in a new Region',
      'Restore permissions for the only IAM administrator after they were accidentally removed',
      'Create an Amazon CloudWatch billing alarm',
    ],
    answer: [0, 3],
    explanation:
      'AWS documents a short list of tasks that require root user credentials, including **closing the account** and **restoring IAM user permissions** when the only administrator has locked themselves out. Creating IAM groups, launching instances and creating billing alarms can all be done by IAM identities with the right permissions.',
  },
  {
    id: 'sec-021',
    domain: 'security-compliance',
    question: 'Which action is an AWS recommended best practice for protecting the AWS account root user?',
    options: [
      'Enable MFA on the root user and avoid using it for everyday tasks',
      'Create access keys for the root user so scripts can use them',
      'Share the root user credentials with the operations team for emergencies',
      'Use the root user for daily administration so activity is in one place',
    ],
    answer: [0],
    explanation:
      'AWS recommends **enabling MFA on the root user**, not creating root access keys, and using the root user **only for tasks that require it**. Sharing root credentials or using root for daily work greatly increases the risk and impact of a compromise.',
  },
  {
    id: 'sec-022',
    domain: 'security-compliance',
    question:
      'An application running on Amazon EC2 instances needs to read objects from an Amazon S3 bucket. What is the MOST secure way to give the application credentials?',
    options: [
      "Store an IAM user's access keys in the application configuration file",
      'Attach an IAM role with the required permissions to the EC2 instances',
      'Embed the root user access keys in the Amazon Machine Image (AMI)',
      'Make the S3 bucket public so no credentials are required',
    ],
    answer: [1],
    explanation:
      'An **IAM role attached to the instance** (through an instance profile) provides **temporary credentials** that are rotated automatically, so no long-term keys are stored on the server. Storing access keys in files or AMIs risks leaking long-term credentials, and making the bucket public exposes the data to everyone.',
  },
  {
    id: 'sec-023',
    domain: 'security-compliance',
    question: 'What does the principle of least privilege mean in AWS Identity and Access Management (IAM)?',
    options: [
      'Give every developer administrator access so work is not blocked',
      'Assign permissions to IAM groups instead of to individual users',
      'Grant only the permissions required to perform a task',
      'Require all users to change their passwords regularly',
    ],
    answer: [2],
    explanation:
      '**Least privilege** means granting identities **only the permissions they need** to do their job, and nothing more. Using groups and rotating passwords are separate best practices, and giving everyone administrator access is the opposite of least privilege.',
  },
  {
    id: 'sec-024',
    domain: 'security-compliance',
    question:
      'A company has many AWS accounts in AWS Organizations. Employees should sign in once with their existing corporate identity provider and then access the accounts they are assigned to. Which AWS service should the company use?',
    options: [
      'Amazon Cognito user pools',
      'Separate IAM users in every account',
      'AWS Secrets Manager',
      'AWS IAM Identity Center',
    ],
    answer: [3],
    explanation:
      '**AWS IAM Identity Center** (successor to AWS Single Sign-On) provides workforce single sign-on to multiple AWS accounts and applications and can connect to an external identity provider. Cognito is for customer identities in web and mobile apps, separate IAM users per account do not scale and are not single sign-on, and Secrets Manager stores secrets.',
  },
  {
    id: 'sec-025',
    domain: 'security-compliance',
    question: 'Which of the following are AWS IAM security best practices? (Choose two.)',
    options: [
      'Use the root user for daily administrative tasks',
      'Require multi-factor authentication (MFA) for users, especially privileged users',
      'Share one IAM user between team members to reduce the number of identities',
      'Attach policies that allow all actions on all resources to every user',
      'Use IAM roles and temporary credentials for workloads and human access',
    ],
    answer: [1, 4],
    explanation:
      'AWS recommends **requiring MFA** and using **roles with temporary credentials** instead of long-term credentials. Using the root user for daily work, sharing credentials, and granting full access to everyone all violate IAM best practices and least privilege.',
  },
  {
    id: 'sec-026',
    domain: 'security-compliance',
    question:
      'A company uses AWS Organizations. It must prevent every account in one organizational unit (OU) from using a specific AWS Region, even if a user in those accounts has administrator permissions. What should the company use?',
    options: [
      'Service control policies (SCPs)',
      'An IAM account password policy',
      'Security groups',
      'AWS Config rules',
    ],
    answer: [0],
    explanation:
      '**SCPs** set the maximum available permissions for accounts in an OU, so a deny in an SCP applies even to administrators in member accounts. A password policy only controls password rules, security groups filter network traffic, and AWS Config rules detect noncompliance but do not prevent actions.',
  },
  {
    id: 'sec-027',
    domain: 'security-compliance',
    question: 'Which statement about service control policies (SCPs) in AWS Organizations is correct?',
    options: [
      'SCPs grant permissions to IAM users and roles in member accounts',
      'SCPs set the maximum permissions available in member accounts but do not grant permissions',
      'SCPs restrict the users and roles in the management account',
      'SCPs replace the need for IAM policies in member accounts',
    ],
    answer: [1],
    explanation:
      'SCPs are **guardrails**: they limit the maximum permissions in member accounts but **never grant** permissions, so IAM policies are still needed to allow actions. SCPs do not affect users or roles in the **management account**.',
  },
  {
    id: 'sec-028',
    domain: 'security-compliance',
    question:
      'A company wants a managed service to create and control the encryption keys used to encrypt data in Amazon S3 and Amazon EBS, with key usage controlled by policies and logged in AWS CloudTrail. Which service should it use?',
    options: [
      'AWS CloudHSM',
      'AWS Certificate Manager (ACM)',
      'AWS Key Management Service (AWS KMS)',
      'AWS Secrets Manager',
    ],
    answer: [2],
    explanation:
      '**AWS KMS** is a managed service for creating and controlling encryption keys; it integrates with most AWS services such as S3 and EBS, uses key policies, and logs key usage to CloudTrail. CloudHSM provides dedicated HSMs that the customer manages, ACM manages TLS certificates, and Secrets Manager stores secrets such as passwords.',
  },
  {
    id: 'sec-029',
    domain: 'security-compliance',
    question:
      'A regulation requires a company to generate and store its encryption keys in dedicated, single-tenant hardware security modules (HSMs) that the company exclusively controls. Which AWS service meets this requirement?',
    options: [
      'AWS KMS with AWS managed keys',
      'AWS Secrets Manager',
      'AWS Certificate Manager (ACM)',
      'AWS CloudHSM',
    ],
    answer: [3],
    explanation:
      '**AWS CloudHSM** provides **dedicated, single-tenant HSMs** in the customer VPC, and the customer manages the keys and users. AWS managed keys in KMS are created and managed by AWS for the customer, Secrets Manager stores secrets, and ACM manages TLS certificates.',
  },
  {
    id: 'sec-030',
    domain: 'security-compliance',
    question: 'Which actions help protect data in transit? (Choose two.)',
    options: [
      'Require HTTPS (TLS) for all client connections to the application',
      'Enable default encryption on an Amazon S3 bucket',
      'Enable S3 Versioning on the bucket',
      'Configure an IAM account password policy',
      'Connect the on-premises network to the VPC through AWS Site-to-Site VPN (IPsec)',
    ],
    answer: [0, 4],
    explanation:
      '**TLS (HTTPS)** and **IPsec VPN tunnels** encrypt data while it moves across the network. S3 default encryption protects data **at rest**, versioning protects against overwrites and deletions, and a password policy controls IAM password strength.',
  },
  {
    id: 'sec-031',
    domain: 'security-compliance',
    question:
      'A company wants to provision public SSL/TLS certificates for its Application Load Balancer and have them renewed automatically. Which AWS service should it use?',
    options: [
      'AWS Certificate Manager (ACM)',
      'AWS Key Management Service (AWS KMS)',
      'AWS Secrets Manager',
      'AWS CloudHSM',
    ],
    answer: [0],
    explanation:
      '**AWS Certificate Manager** provisions, manages and deploys SSL/TLS certificates for integrated services such as Elastic Load Balancing, CloudFront and API Gateway, and **renews ACM-issued certificates automatically**. KMS and CloudHSM manage encryption keys, and Secrets Manager stores and rotates secrets.',
  },
  {
    id: 'sec-032',
    domain: 'security-compliance',
    question:
      'A company wants to store the credentials for its Amazon RDS database securely and rotate them automatically on a schedule without changing application code each time. Which AWS service should it use?',
    options: [
      'AWS Key Management Service (AWS KMS)',
      'AWS Secrets Manager',
      'AWS Certificate Manager (ACM)',
      'Amazon Macie',
    ],
    answer: [1],
    explanation:
      '**AWS Secrets Manager** stores secrets such as database credentials and API keys and supports **automatic rotation**, including built-in support for Amazon RDS. KMS manages encryption keys rather than application secrets, ACM manages certificates, and Macie discovers sensitive data in S3.',
  },
  {
    id: 'sec-033',
    domain: 'security-compliance',
    question:
      'A company is preparing for an audit and wants to continuously collect evidence about its own AWS resource usage and map it to frameworks such as PCI DSS. Which AWS service should it use?',
    options: ['AWS Artifact', 'AWS Config', 'AWS Audit Manager', 'AWS CloudTrail'],
    answer: [2],
    explanation:
      "**AWS Audit Manager** continuously collects evidence from the customer's AWS usage and organizes it against prebuilt and custom **frameworks** to simplify audit preparation. Artifact provides AWS's own compliance reports, while AWS Config and CloudTrail are data sources that Audit Manager can draw on but they do not build audit-ready assessments.",
  },
  {
    id: 'sec-034',
    domain: 'security-compliance',
    question:
      'Which AWS service inspects an AWS environment and provides recommendations across categories such as cost optimization, performance, fault tolerance, and security, including whether MFA is enabled on the root user?',
    options: ['Amazon Inspector', 'AWS Config', 'Amazon GuardDuty', 'AWS Trusted Advisor'],
    answer: [3],
    explanation:
      '**AWS Trusted Advisor** gives best-practice recommendations in several categories, and its **security checks** include items such as root user MFA and S3 bucket permissions. Inspector scans workloads for vulnerabilities, AWS Config evaluates resources against rules you define, and GuardDuty detects threats.',
  },
  {
    id: 'sec-035',
    domain: 'security-compliance',
    question:
      'A company stores data in Amazon S3. Which of the following are the responsibility of the company? (Choose two.)',
    options: [
      'Maintaining the storage hardware that holds the objects',
      'Configuring bucket policies and access controls',
      'Choosing encryption options and managing access to keys for sensitive data',
      'Replicating data across devices to achieve the designed durability',
      'Patching the software that runs the S3 service',
    ],
    answer: [1, 2],
    explanation:
      'Customers are responsible for **who can access their data** (bucket policies, IAM, Block Public Access) and **how it is protected** (encryption choices and key access). AWS maintains the hardware, the redundancy that delivers S3 durability, and the service software.',
  },
  {
    id: 'sec-036',
    domain: 'security-compliance',
    question: "Which phrase best describes AWS's part of the shared responsibility model?",
    options: [
      'Security of the cloud: the infrastructure that runs AWS services',
      'Security in the cloud: customer data and resource configurations',
      'Security of the application code that customers deploy',
      'Security of the IAM identities that customers create',
    ],
    answer: [0],
    explanation:
      'AWS is responsible for **security of the cloud**: the hardware, software, networking and facilities that run AWS services. Customers are responsible for **security in the cloud**, which includes their data, configurations, application code and IAM identities.',
  },
  {
    id: 'sec-037',
    domain: 'security-compliance',
    question: 'Which of the following is an example of a shared control under the AWS shared responsibility model?',
    options: [
      'Physical and environmental controls',
      'Patch management',
      'Zone security for customer data',
      'Data center access controls',
    ],
    answer: [1],
    explanation:
      'AWS lists **patch management**, configuration management, and awareness and training as **shared controls**: AWS patches its infrastructure and customers patch their own guest OS and applications. Physical, environmental and data center access controls are inherited from AWS, and zone security of customer data is customer-specific.',
  },
  {
    id: 'sec-038',
    domain: 'security-compliance',
    question: 'Which control does a customer fully inherit from AWS?',
    options: [
      'Configuring the operating system firewall on EC2 instances',
      'Encrypting application data before storing it',
      'Physical and environmental controls',
      'Managing IAM users and their permissions',
    ],
    answer: [2],
    explanation:
      'Customers **inherit physical and environmental controls** from AWS because they have no access to AWS facilities. Configuring OS firewalls, encrypting application data and managing IAM identities are customer responsibilities.',
  },
  {
    id: 'sec-039',
    domain: 'security-compliance',
    question:
      'A company moves workloads from Amazon EC2 to managed services such as Amazon RDS and AWS Lambda. How does this generally change its security responsibilities?',
    options: [
      'The company takes on more operating system patching work',
      'The company becomes responsible for physical security of the servers',
      'Responsibility for data classification moves from the company to AWS',
      'AWS takes on more tasks such as OS patching, while the company still protects its data and access',
    ],
    answer: [3],
    explanation:
      'The more managed the service, the **more operational security AWS takes on** (for example, OS and platform patching). The customer always remains responsible for **its data, access management and configuration**, and never becomes responsible for physical security.',
  },
  {
    id: 'sec-040',
    domain: 'security-compliance',
    question: 'A company uses AWS Lambda. Which of the following are responsibilities of AWS? (Choose two.)',
    options: [
      'The security of the function code',
      'The permissions in the function execution role',
      'The sensitivity of the data the function processes',
      'Patching the operating system of the execution environment',
      'Provisioning and scaling the underlying compute infrastructure',
    ],
    answer: [3, 4],
    explanation:
      'For Lambda, AWS manages the **operating system and runtime environment patching** and the **underlying infrastructure and its scaling**. The customer is responsible for function code, IAM permissions such as the execution role, and the data the function handles.',
  },
  {
    id: 'sec-041',
    domain: 'security-compliance',
    question:
      "An IAM user's policy allows `s3:*`. The user is also in a group whose policy explicitly denies `s3:DeleteObject`. What happens when the user tries to delete an object?",
    options: [
      'The request is denied because an explicit deny overrides any allow',
      'The request is allowed because user policies take precedence over group policies',
      'The request is allowed because the most permissive policy wins',
      'The request is denied only if the user did not sign in with MFA',
    ],
    answer: [0],
    explanation:
      'In IAM policy evaluation, an **explicit deny always overrides an allow**, no matter which policy contains it. User and group policies are evaluated together with no precedence between them, and MFA is not a factor unless a policy condition requires it.',
  },
  {
    id: 'sec-042',
    domain: 'security-compliance',
    question: 'An administrator creates a new IAM user and attaches no policies. What can the user do?',
    options: [
      'Read all resources in the account',
      'Nothing, because all requests are implicitly denied until permissions are granted',
      'Use all services in the Region where the user was created',
      'Everything the root user can do',
    ],
    answer: [1],
    explanation:
      'IAM is **deny by default**: a new user has **no permissions** until a policy grants them. IAM users are not tied to a Region, and they never automatically receive read-only or root-level access.',
  },
  {
    id: 'sec-043',
    domain: 'security-compliance',
    question:
      'Fifty developers need the same set of permissions, and the permissions change often. What is the EASIEST way to manage this with IAM?',
    options: [
      'Attach the same policy to each developer individually',
      'Have all developers share a single IAM user',
      'Create an IAM group, attach the policy to it, and add the developers',
      'Create a separate IAM role for each developer',
    ],
    answer: [2],
    explanation:
      'An **IAM group** lets you attach a policy once and manage permissions for all its members in one place. Attaching policies one by one is error-prone, sharing a user removes accountability, and one role per developer adds unnecessary management.',
  },
  {
    id: 'sec-044',
    domain: 'security-compliance',
    question:
      'A developer with an IAM user wants to call AWS APIs from the AWS CLI on a laptop. Which credentials does the CLI use?',
    options: [
      'The IAM user console password',
      'An Amazon EC2 key pair',
      'The serial number of the MFA device',
      'An access key ID and secret access key',
    ],
    answer: [3],
    explanation:
      'Programmatic access through the CLI, SDKs or API uses an **access key ID and secret access key** (or temporary credentials). Console passwords are for the AWS Management Console, EC2 key pairs are for SSH into instances, and an MFA serial number is not a credential by itself.',
  },
  {
    id: 'sec-045',
    domain: 'security-compliance',
    question: 'Which of the following are supported MFA methods for AWS IAM users? (Choose two.)',
    options: [
      'A virtual authenticator app on a phone',
      'A FIDO security key or passkey',
      'A one-time link sent by email',
      'Answers to personal security questions',
      'An allow list of trusted IP addresses',
    ],
    answer: [0, 1],
    explanation:
      'IAM supports **virtual authenticator apps**, **FIDO passkeys and security keys**, and hardware TOTP tokens as MFA. Email links, security questions and IP allow lists are not IAM MFA methods.',
  },
  {
    id: 'sec-046',
    domain: 'security-compliance',
    question:
      'An administrator wants all IAM user passwords to meet a minimum length and contain at least one number. What should the administrator configure?',
    options: [
      'An IAM account password policy',
      'A service control policy (SCP)',
      'An AWS Config rule',
      'A secret in AWS Secrets Manager',
    ],
    answer: [0],
    explanation:
      'An **IAM password policy** sets requirements for IAM user passwords such as minimum length, required character types, expiration and reuse prevention. SCPs limit permissions, AWS Config rules evaluate resource configurations, and Secrets Manager stores secrets.',
  },
  {
    id: 'sec-047',
    domain: 'security-compliance',
    question:
      'An auditor wants a report that lists every IAM user in the account and the status of their passwords, access keys, and MFA devices. What should the administrator provide?',
    options: [
      'AWS CloudTrail event history',
      'The IAM credential report',
      'The AWS Config resource timeline',
      'An Amazon Inspector findings report',
    ],
    answer: [1],
    explanation:
      'The **IAM credential report** lists all users in the account and the status of their credentials, including passwords, access keys and MFA. CloudTrail shows API activity, the AWS Config timeline shows configuration changes, and Inspector reports software vulnerabilities.',
  },
  {
    id: 'sec-048',
    domain: 'security-compliance',
    question:
      'Users in AWS account A need to access resources in AWS account B. The company does not want to create IAM users in account B. What should it do?',
    options: [
      "Share account B's root user credentials with the users",
      'Create access keys in account B and email them to the users',
      'Create an IAM role in account B that trusts account A, and let the users assume it',
      'Create a security group in account B that references account A',
    ],
    answer: [2],
    explanation:
      'A **cross-account IAM role** in account B with a trust policy for account A lets users get **temporary credentials** for account B without long-term credentials there. Sharing root credentials or emailing access keys is insecure, and security groups control network traffic, not API access.',
  },
  {
    id: 'sec-049',
    domain: 'security-compliance',
    question:
      'A company wants employees to access AWS with their existing corporate directory credentials instead of creating an IAM user for each employee. Which approach should it use?',
    options: [
      'Create an IAM user for each employee with the same password as the directory',
      'Have all employees share one IAM user',
      'Store the directory passwords in AWS Secrets Manager',
      'Use identity federation so users sign in with their corporate identities',
    ],
    answer: [3],
    explanation:
      '**Identity federation** (for example SAML 2.0 through IAM Identity Center or IAM) lets users from an external identity provider access AWS with **temporary credentials** and no IAM users. Duplicating or sharing IAM users is harder to manage and less secure, and storing directory passwords in Secrets Manager does not provide sign-in.',
  },
  {
    id: 'sec-050',
    domain: 'security-compliance',
    question: 'Which statements about IAM roles are correct? (Choose two.)',
    options: [
      'A role has a long-term password that never expires',
      'A role can be assumed only by IAM users in the same account',
      'A role provides temporary security credentials when it is assumed',
      'A role can be assumed by AWS services such as Amazon EC2 and AWS Lambda',
      'A role must be added to an IAM group before it can be used',
    ],
    answer: [2, 3],
    explanation:
      'IAM roles have no long-term credentials; assuming a role returns **temporary credentials**, and roles can be assumed by **AWS services**, users, federated identities and other accounts. Roles cannot be added to IAM groups (groups contain only users).',
  },
  {
    id: 'sec-051',
    domain: 'security-compliance',
    question:
      'A company notices that an IP address belonging to AWS is sending spam and port-scanning its servers. Whom should the company contact?',
    options: [
      'The AWS Abuse team, using the AWS abuse reporting process',
      'AWS Professional Services',
      'The AWS Partner Network (APN)',
      'AWS Marketplace sellers',
    ],
    answer: [0],
    explanation:
      'Suspected misuse of AWS resources, such as spam, port scanning or DDoS traffic coming from AWS, should be reported to the **AWS Abuse team** (AWS Trust & Safety). Professional Services, the Partner Network and Marketplace sellers do not handle abuse reports.',
  },
  {
    id: 'sec-052',
    domain: 'security-compliance',
    question:
      'Where can a user find answers, written by AWS, to frequently asked technical questions and common support issues?',
    options: ['AWS Artifact', 'AWS Knowledge Center', 'AWS Marketplace', 'AWS Trusted Advisor'],
    answer: [1],
    explanation:
      'The **AWS Knowledge Center** contains articles that answer the most frequent questions and requests that AWS receives from customers. Artifact provides compliance reports, Marketplace sells software, and Trusted Advisor gives recommendations for your own account.',
  },
  {
    id: 'sec-053',
    domain: 'security-compliance',
    question:
      'A company wants to buy a third-party next-generation firewall appliance, deploy it in its VPC, and pay for it on its AWS bill. Where should it look?',
    options: ['AWS Artifact', 'AWS Partner Network (APN)', 'AWS Marketplace', 'AWS Knowledge Center'],
    answer: [2],
    explanation:
      '**AWS Marketplace** is a digital catalog where customers find, buy and deploy third-party software, including security products, with charges on the AWS bill. Artifact provides compliance documents, the APN is for finding partner firms, and the Knowledge Center contains support articles.',
  },
  {
    id: 'sec-054',
    domain: 'security-compliance',
    question:
      'A security engineer wants to read the latest AWS security bulletins, best-practice guidance, and articles about new AWS security features. Which resources should the engineer use?',
    options: [
      'AWS Artifact',
      'The AWS Billing and Cost Management console',
      'AWS Trusted Advisor',
      'The AWS Security Center and the AWS Security Blog',
    ],
    answer: [3],
    explanation:
      'The **AWS Security Center** (the security section of the AWS website) and the **AWS Security Blog** publish security bulletins, guidance and announcements. Artifact holds compliance reports, the billing console is for costs, and Trusted Advisor checks your own account.',
  },
  {
    id: 'sec-055',
    domain: 'security-compliance',
    question:
      'A company wants to find out which compliance programs AWS participates in and which AWS services are in scope for them. Which resources can it use? (Choose two.)',
    options: [
      'AWS Artifact',
      'Amazon Inspector',
      'The AWS Compliance Programs and "Services in Scope" pages on the AWS website',
      'Amazon Macie',
      'AWS Shield',
    ],
    answer: [0, 2],
    explanation:
      '**AWS Artifact** provides AWS compliance reports and agreements, and the **AWS Compliance website** lists compliance programs and the services in scope for each. Inspector, Macie and Shield are security services for your own workloads and do not publish AWS compliance information.',
  },
  {
    id: 'sec-056',
    domain: 'security-compliance',
    question:
      'AWS infrastructure is assessed as compliant with PCI DSS. A company runs a payment application on AWS. Which statement is correct?',
    options: [
      'The company is still responsible for making its own application and configuration PCI DSS compliant',
      'The application automatically becomes PCI DSS compliant because it runs on AWS',
      "AWS performs the company's PCI DSS assessment as part of the AWS bill",
      'The company cannot store cardholder data on AWS',
    ],
    answer: [0],
    explanation:
      "Compliance is **shared**: AWS's certification covers the infrastructure, but the customer must make **its own workloads** compliant and undergo its own assessment. Running on AWS does not make an application compliant automatically, AWS does not perform customer assessments, and cardholder data can be stored on in-scope services.",
  },
  {
    id: 'sec-057',
    domain: 'security-compliance',
    question:
      'A healthcare company must review and accept a Business Associate Addendum (BAA) with AWS before processing protected health information. Which AWS service should it use?',
    options: ['AWS Config', 'AWS Artifact', 'AWS Audit Manager', 'AWS Organizations'],
    answer: [1],
    explanation:
      '**AWS Artifact Agreements** lets customers review, accept and manage agreements with AWS such as the **BAA** for HIPAA. AWS Config tracks resources, Audit Manager collects audit evidence, and Organizations manages multiple accounts.',
  },
  {
    id: 'sec-058',
    domain: 'security-compliance',
    question: 'Which statement about encryption of new objects uploaded to Amazon S3 is correct?',
    options: [
      'Objects are stored unencrypted unless the customer enables encryption',
      'Only objects uploaded through the AWS Management Console are encrypted',
      'All new objects are encrypted at rest with server-side encryption by default',
      'Objects can be encrypted only by using AWS CloudHSM',
    ],
    answer: [2],
    explanation:
      'Amazon S3 now applies **server-side encryption with S3 managed keys (SSE-S3) to all new objects by default**, whatever upload method is used. Customers can choose other options such as SSE-KMS, and CloudHSM is not required.',
  },
  {
    id: 'sec-059',
    domain: 'security-compliance',
    question:
      'A company must keep its customer data stored within a specific country for regulatory reasons. What should it do on AWS?',
    options: [
      'Nothing, because AWS replicates all data to every Region',
      'Store the data in an edge location in that country',
      'Enable AWS Shield Advanced for the data',
      'Choose an AWS Region in that country, because AWS does not move content out of the Region the customer selects',
    ],
    answer: [3],
    explanation:
      "Customers **choose the Region** where their content is stored, and AWS does not move it outside that Region unless the customer does so, which supports **data residency** requirements. AWS does not replicate data to all Regions, edge locations are for caching and content delivery, and Shield is DDoS protection.",
  },
  {
    id: 'sec-060',
    domain: 'security-compliance',
    question: 'Which of the following are features of AWS CloudTrail? (Choose two.)',
    options: [
      'Collecting CPU utilization metrics from EC2 instances',
      'Recording API calls in the account, including the caller identity and time',
      'Scanning EC2 instances for software vulnerabilities',
      'Delivering log files to an Amazon S3 bucket for long-term retention',
      'Blocking malicious HTTP requests to web applications',
    ],
    answer: [1, 3],
    explanation:
      'CloudTrail **records API activity** (who, what, when, from where) and a trail can **deliver log files to S3** for retention and analysis. CPU metrics come from CloudWatch, vulnerability scanning is Amazon Inspector, and blocking HTTP requests is AWS WAF.',
  },
  {
    id: 'sec-061',
    domain: 'security-compliance',
    question:
      'A network engineer wants to capture information about the IP traffic going to and from network interfaces in a VPC. Which feature should the engineer use?',
    options: ['VPC Flow Logs', 'AWS CloudTrail', 'AWS Config', 'AWS WAF logging'],
    answer: [0],
    explanation:
      '**VPC Flow Logs** capture information about IP traffic to and from network interfaces in a VPC, such as source, destination, port and whether the traffic was accepted. CloudTrail logs API calls, AWS Config records resource configurations, and WAF logs only cover web requests that WAF inspects.',
  },
  {
    id: 'sec-062',
    domain: 'security-compliance',
    question:
      'A company wants to centrally manage many AWS accounts, use consolidated billing, and apply policies to groups of accounts. Which AWS service should it use?',
    options: [
      'AWS IAM Identity Center',
      'AWS Organizations',
      'AWS Resource Access Manager',
      'AWS Systems Manager',
    ],
    answer: [1],
    explanation:
      '**AWS Organizations** groups accounts into organizational units, provides **consolidated billing**, and applies policies such as SCPs. IAM Identity Center manages workforce sign-in, Resource Access Manager shares resources between accounts, and Systems Manager manages instances and operations.',
  },
  {
    id: 'sec-063',
    domain: 'security-compliance',
    question:
      'A company wants the easiest way to set up and govern a secure, multi-account AWS environment (a landing zone) with preconfigured controls (guardrails). Which AWS service should it use?',
    options: ['AWS Config', 'AWS Security Hub', 'AWS Control Tower', 'AWS Trusted Advisor'],
    answer: [2],
    explanation:
      '**AWS Control Tower** automates the setup of a multi-account **landing zone** based on best practices and applies preventive and detective **controls**. AWS Config evaluates configurations, Security Hub aggregates findings, and Trusted Advisor gives recommendations, but none of them build a governed multi-account environment.',
  },
  {
    id: 'sec-064',
    domain: 'security-compliance',
    question:
      'A security team wants to identify resources such as S3 buckets, IAM roles, and KMS keys that are shared with an entity outside the AWS account or organization. Which feature should it use?',
    options: ['Amazon Macie', 'AWS Trusted Advisor', 'Amazon Inspector', 'IAM Access Analyzer'],
    answer: [3],
    explanation:
      '**IAM Access Analyzer** analyzes resource-based policies to find resources such as S3 buckets, IAM roles and KMS keys that are **shared with external principals**. Macie focuses on sensitive data in S3, Trusted Advisor gives general recommendations, and Inspector scans for software vulnerabilities.',
  },
  {
    id: 'sec-065',
    domain: 'security-compliance',
    question: 'Which statements correctly compare security groups and network ACLs? (Choose two.)',
    options: [
      'Security groups are stateless and network ACLs are stateful',
      'Network ACLs are applied at the instance level and security groups at the subnet level',
      'Security groups support allow rules only, while network ACLs support allow and deny rules',
      'A security group rule can explicitly block a single IP address',
      'Network ACL rules are evaluated in number order, lowest first, until a rule matches',
    ],
    answer: [2, 4],
    explanation:
      'Security groups have **allow rules only**, while network ACLs have **allow and deny rules** that are **evaluated in number order**. Security groups are stateful at the instance level and network ACLs are stateless at the subnet level, and because security groups cannot deny, they cannot explicitly block one IP address.',
  },
  {
    id: 'sec-066',
    domain: 'security-compliance',
    question:
      'A company wants to block traffic from one specific malicious IP address to all instances in a subnet. What should it use?',
    options: [
      'A deny rule in the network ACL for the subnet',
      'A deny rule in the security group of the instances',
      'An IAM policy that denies the IP address',
      'An AWS Config rule that flags the IP address',
    ],
    answer: [0],
    explanation:
      'A **network ACL** applies to the whole subnet and supports **deny rules**, so it can block a specific IP address. Security groups do not support deny rules, IAM policies control API access rather than network traffic to instances, and AWS Config rules only evaluate configurations.',
  },
  {
    id: 'sec-067',
    domain: 'security-compliance',
    question: 'What is the default behavior of a newly created custom security group?',
    options: [
      'All inbound and all outbound traffic is allowed',
      'All inbound traffic is denied and all outbound traffic is allowed',
      'All inbound traffic is allowed and all outbound traffic is denied',
      'All inbound and all outbound traffic is denied',
    ],
    answer: [1],
    explanation:
      'A new security group has **no inbound rules** (so all inbound traffic is denied) and an **outbound rule that allows all traffic**. You add inbound allow rules to permit specific traffic.',
  },
  {
    id: 'sec-068',
    domain: 'security-compliance',
    question: "What is the default behavior of a VPC's default network ACL?",
    options: [
      'It denies all inbound and all outbound traffic',
      'It denies inbound traffic and allows outbound traffic',
      'It allows all inbound and all outbound traffic',
      'It allows only SSH and HTTP inbound traffic',
    ],
    answer: [2],
    explanation:
      "A VPC's **default network ACL allows all inbound and outbound traffic**. By contrast, a newly created **custom** network ACL denies all traffic until you add allow rules.",
  },
  {
    id: 'sec-069',
    domain: 'security-compliance',
    question: 'Which statement about Amazon GuardDuty is correct?',
    options: [
      'It requires installing an agent on every instance before it can detect any threats',
      'It scans the contents of S3 objects to classify personally identifiable information',
      'It blocks malicious traffic at the network edge before it reaches resources',
      'Its foundational threat detection analyzes sources such as CloudTrail, VPC Flow Logs, and DNS logs without changes to workloads',
    ],
    answer: [3],
    explanation:
      "GuardDuty's foundational detection works from **CloudTrail management events, VPC Flow Logs and DNS logs** that it reads independently, so no agents or workload changes are needed (agents are used only for optional runtime monitoring). Classifying PII is Macie, and GuardDuty detects threats but does not block traffic itself.",
  },
  {
    id: 'sec-070',
    domain: 'security-compliance',
    question:
      'A company wants to (1) find sensitive data stored in Amazon S3 and (2) find software vulnerabilities on its Amazon EC2 instances. Which services should it use? (Choose two.)',
    options: ['Amazon Macie', 'Amazon Detective', 'AWS Shield', 'Amazon Inspector', 'AWS Artifact'],
    answer: [0, 3],
    explanation:
      '**Amazon Macie** discovers sensitive data in S3 and **Amazon Inspector** scans EC2 instances for software vulnerabilities. Detective investigates findings, Shield protects against DDoS attacks, and Artifact provides compliance reports.',
  },
  {
    id: 'sec-071',
    domain: 'security-compliance',
    question:
      'An auditor needs proof that AWS CloudTrail log files were not modified or deleted after CloudTrail delivered them. Which feature provides this?',
    options: [
      'CloudTrail log file integrity validation',
      'Amazon CloudWatch metric filters',
      'AWS Config conformance packs',
      'Amazon Macie sensitive data discovery',
    ],
    answer: [0],
    explanation:
      '**CloudTrail log file integrity validation** uses digest files with hashing and digital signatures to show whether log files were changed or deleted after delivery. Metric filters turn logs into metrics, conformance packs group Config rules, and Macie finds sensitive data.',
  },
  {
    id: 'sec-072',
    domain: 'security-compliance',
    question:
      'A company wants to collect, store, and search the operating system and application log files from its EC2 instances in a central AWS service. Which service should it use?',
    options: ['AWS CloudTrail', 'Amazon CloudWatch Logs', 'AWS Config', 'AWS Artifact'],
    answer: [1],
    explanation:
      '**Amazon CloudWatch Logs** (with the CloudWatch agent on the instances) centrally collects, stores and queries OS and application logs. CloudTrail records AWS API calls, not logs from inside instances, AWS Config records resource configurations, and Artifact provides compliance reports.',
  },
  {
    id: 'sec-073',
    domain: 'security-compliance',
    question:
      'A company requires that all Amazon EBS volumes be encrypted and wants to be notified of any volume that is not. Which AWS service should it use?',
    options: ['AWS CloudTrail', 'Amazon Inspector', 'AWS Config', 'AWS Shield'],
    answer: [2],
    explanation:
      '**AWS Config** rules continuously evaluate resources, such as checking whether EBS volumes are encrypted, and report **noncompliant** resources, which can trigger notifications. CloudTrail records API calls, Inspector scans for software vulnerabilities, and Shield protects against DDoS.',
  },
  {
    id: 'sec-074',
    domain: 'security-compliance',
    question:
      'A company wants to use AWS KMS but needs full control over the key policy, the ability to enable or disable the key, and control over rotation settings. Which type of KMS key should it use?',
    options: [
      'AWS owned keys',
      'AWS managed keys',
      'Keys stored as secrets in AWS Secrets Manager',
      'Customer managed keys',
    ],
    answer: [3],
    explanation:
      '**Customer managed keys** are created, owned and managed by the customer, who controls key policies, enabling and disabling, and rotation. AWS managed keys are created and managed by AWS for a service in your account, AWS owned keys are not visible in your account, and Secrets Manager is not a key management service.',
  },
  {
    id: 'sec-075',
    domain: 'security-compliance',
    question: 'Which of the following are benefits of AWS Shield Advanced? (Choose two.)',
    options: [
      'It is automatically enabled for all customers at no additional charge',
      'Access to the AWS Shield Response Team (SRT)',
      'Scanning of EC2 instances for software vulnerabilities',
      'Encryption of data in transit between clients and AWS',
      'Cost protection against scaling charges caused by DDoS attacks',
    ],
    answer: [1, 4],
    explanation:
      'Shield Advanced adds **access to the Shield Response Team** and **DDoS cost protection**, along with enhanced detection and visibility. Automatic free protection describes Shield Standard, vulnerability scanning is Inspector, and encryption in transit is done with TLS.',
  },
  {
    id: 'sec-076',
    domain: 'security-compliance',
    question: 'AWS WAF can be associated directly with which of the following resources?',
    options: [
      'An Amazon CloudFront distribution',
      'An individual Amazon EC2 instance',
      'An Amazon EBS volume',
      'An Amazon S3 Glacier vault',
    ],
    answer: [0],
    explanation:
      'AWS WAF protects web endpoints such as **Amazon CloudFront**, Application Load Balancers and Amazon API Gateway. It cannot be attached directly to an EC2 instance, EBS volume or Glacier vault; to protect an instance you put it behind a supported resource such as an ALB.',
  },
  {
    id: 'sec-077',
    domain: 'security-compliance',
    question:
      'Under the shared responsibility model, who is responsible for configuring the security group rules on Amazon EC2 instances?',
    options: [
      'AWS, because security groups are part of the AWS infrastructure',
      'The customer',
      'AWS Support',
      'The AWS Abuse team',
    ],
    answer: [1],
    explanation:
      'AWS provides the security group feature, but the **customer configures the rules** as part of security in the cloud. AWS Support and the Abuse team do not configure customer resources.',
  },
  {
    id: 'sec-078',
    domain: 'security-compliance',
    question:
      'A company launches an Amazon RDS database. Who is responsible for choosing whether the database storage is encrypted at rest?',
    options: [
      'AWS, which decides for every database',
      'AWS Support, after the customer opens a case',
      'The customer, when configuring the database',
      'The database engine vendor',
    ],
    answer: [2],
    explanation:
      'Protecting data, including **choosing encryption at rest** and the KMS key to use, is a **customer** responsibility, even on a managed service like RDS. AWS provides the encryption feature, but it does not decide for the customer, and engine vendors are not involved.',
  },
  {
    id: 'sec-079',
    domain: 'security-compliance',
    question:
      'A company wants a managed, stateful network firewall with intrusion prevention and domain name filtering to inspect traffic at the perimeter of its VPC. Which AWS service should it use?',
    options: ['AWS WAF', 'AWS Shield Standard', 'Security groups', 'AWS Network Firewall'],
    answer: [3],
    explanation:
      '**AWS Network Firewall** is a managed firewall for VPCs with stateful inspection, intrusion prevention and domain filtering. AWS WAF filters HTTP(S) requests to web applications, Shield protects against DDoS, and security groups are instance-level allow lists without intrusion prevention.',
  },
  {
    id: 'sec-080',
    domain: 'security-compliance',
    question: 'Which actions follow AWS best practices for the root user? (Choose two.)',
    options: [
      'Enable MFA for the root user',
      'Create access keys for the root user for use in CI/CD pipelines',
      'Sign in as the root user for routine tasks to reduce the number of identities',
      'Share the root user password with all administrators',
      'Use separate administrative identities for daily work and keep the root user for tasks that require it',
    ],
    answer: [0, 4],
    explanation:
      'AWS recommends **enabling MFA on the root user** and **using it only for tasks that require root**, with other identities for daily administration. Root access keys, routine root sign-ins and shared root passwords all increase the risk of compromise.',
  },
  {
    id: 'sec-081',
    domain: 'security-compliance',
    question: 'Which AWS service issues the temporary security credentials returned when an IAM role is assumed?',
    options: [
      'AWS Security Token Service (AWS STS)',
      'AWS Key Management Service (AWS KMS)',
      'AWS Secrets Manager',
      'AWS Certificate Manager (ACM)',
    ],
    answer: [0],
    explanation:
      '**AWS STS** issues temporary, limited-privilege credentials, for example through the `AssumeRole` API. KMS manages encryption keys, Secrets Manager stores secrets, and ACM manages TLS certificates.',
  },
  {
    id: 'sec-082',
    domain: 'security-compliance',
    question:
      'A company is building a mobile app and needs sign-up and sign-in for millions of customers. Which AWS service should it use?',
    options: [
      'IAM users, one for each customer',
      'Amazon Cognito',
      'AWS IAM Identity Center',
      'AWS Organizations',
    ],
    answer: [1],
    explanation:
      '**Amazon Cognito** provides sign-up, sign-in and access control for **customers** of web and mobile apps at scale. IAM users are for people and workloads that manage your AWS account, IAM Identity Center is for workforce access, and Organizations manages accounts.',
  },
  {
    id: 'sec-083',
    domain: 'security-compliance',
    question: 'In which format are AWS IAM policy documents written?',
    options: ['XML', 'YAML', 'JSON', 'CSV'],
    answer: [2],
    explanation:
      'IAM policies are **JSON** documents made of statements with elements such as `Effect`, `Action`, `Resource` and optionally `Condition`. XML, YAML and CSV are not used for IAM policy documents.',
  },
  {
    id: 'sec-084',
    domain: 'security-compliance',
    question:
      'A policy is attached to an Amazon S3 bucket and specifies which principals can access the bucket. What type of policy is this?',
    options: [
      'An identity-based policy',
      'A service control policy',
      'An IAM password policy',
      'A resource-based policy',
    ],
    answer: [3],
    explanation:
      'A **bucket policy** is a **resource-based policy**: it is attached to the resource and names the principals that can access it. Identity-based policies attach to users, groups or roles, SCPs apply to accounts in an organization, and a password policy controls password rules.',
  },
  {
    id: 'sec-085',
    domain: 'security-compliance',
    question: 'Which IAM capabilities help a company refine permissions toward least privilege? (Choose two.)',
    options: [
      'Attaching the AdministratorAccess policy to all users',
      'IAM Access Analyzer policy generation based on CloudTrail activity',
      'Last accessed information that shows which services an identity has used',
      'Enabling AWS Shield Advanced',
      'Using the root user for all changes',
    ],
    answer: [1, 2],
    explanation:
      '**IAM Access Analyzer** can generate a policy from actual activity in CloudTrail, and **last accessed information** shows unused permissions that can be removed. Granting AdministratorAccess or using the root user is the opposite of least privilege, and Shield Advanced is DDoS protection.',
  },
  {
    id: 'sec-086',
    domain: 'security-compliance',
    question: 'Which statement about AWS Identity and Access Management (IAM) is correct?',
    options: [
      'IAM is a global service, so users and roles are not tied to a specific Region',
      'IAM must be set up separately in each Region',
      'IAM is charged per user per month',
      'An IAM user can access resources in only one Region',
    ],
    answer: [0],
    explanation:
      'IAM is a **global** service: identities and policies apply across all Regions in the account, and IAM is offered at **no additional charge**. Policies can still restrict Regions, but users are not created per Region.',
  },
  {
    id: 'sec-087',
    domain: 'security-compliance',
    question:
      'A company wants to hire an outside firm with proven AWS security expertise to help design and review its architecture. Where should it look?',
    options: [
      'AWS Marketplace',
      'The AWS Partner Network (APN), such as partners with an AWS Security Competency',
      'AWS Artifact',
      'AWS Knowledge Center',
    ],
    answer: [1],
    explanation:
      'The **AWS Partner Network** lists consulting and technology partners, including those validated with **AWS Competencies** such as Security. Marketplace is mainly for buying software, Artifact provides compliance documents, and the Knowledge Center has support articles.',
  },
  {
    id: 'sec-088',
    domain: 'security-compliance',
    question:
      'A company wants to run a penetration test against its own Amazon EC2 instances. Which statement is correct?',
    options: [
      'The company must get written approval from AWS before every test',
      'Penetration testing is not permitted on AWS',
      'Customers can test certain AWS services, including EC2, without prior approval if they follow the AWS policy',
      'Only AWS Professional Services is allowed to perform penetration tests',
    ],
    answer: [2],
    explanation:
      "AWS's penetration testing policy lets customers test a list of **permitted services, including Amazon EC2, without prior approval**, as long as they avoid prohibited activities such as DoS attacks. Testing is allowed and can be done by the customer or anyone it hires.",
  },
  {
    id: 'sec-089',
    domain: 'security-compliance',
    question:
      'Which AWS service would report that an Amazon EC2 instance is running a software package with a known Common Vulnerabilities and Exposures (CVE) entry?',
    options: ['Amazon GuardDuty', 'Amazon Macie', 'AWS Shield', 'Amazon Inspector'],
    answer: [3],
    explanation:
      '**Amazon Inspector** scans workloads for **known software vulnerabilities (CVEs)** and network exposure. GuardDuty detects suspicious activity rather than vulnerable packages, Macie finds sensitive data in S3, and Shield protects against DDoS.',
  },
  {
    id: 'sec-090',
    domain: 'security-compliance',
    question: 'Which statements are correct? (Choose two.)',
    options: [
      'Amazon CloudWatch records which IAM identity made each AWS API call',
      'AWS Config prevents users from making API calls that would violate a Config rule',
      'AWS CloudTrail measures memory usage of EC2 instances',
      'AWS Config records configuration changes to resources over time',
      'Amazon CloudWatch collects metrics and can trigger alarms',
    ],
    answer: [3, 4],
    explanation:
      '**AWS Config** records **resource configuration history**, and **CloudWatch** collects **metrics and logs and triggers alarms**. Recording who made API calls is CloudTrail, AWS Config evaluates and reports compliance rather than blocking API calls, and CloudTrail does not measure instance memory.',
  },
  {
    id: 'sec-091',
    domain: 'security-compliance',
    question: 'Amazon Macie discovers sensitive data stored in which AWS service?',
    options: ['Amazon S3', 'Amazon EBS', 'Amazon RDS', 'Amazon DynamoDB'],
    answer: [0],
    explanation:
      '**Amazon Macie** discovers and protects sensitive data in **Amazon S3**. It does not scan EBS volumes, RDS databases or DynamoDB tables.',
  },
  {
    id: 'sec-092',
    domain: 'security-compliance',
    question:
      'A company wants to continuously check its AWS accounts against security standards such as the CIS AWS Foundations Benchmark and AWS Foundational Security Best Practices. Which service should it use?',
    options: ['Amazon Inspector', 'AWS Security Hub', 'Amazon Macie', 'AWS Artifact'],
    answer: [1],
    explanation:
      '**AWS Security Hub** runs automated, continuous checks against security standards such as **CIS AWS Foundations Benchmark** and **AWS Foundational Security Best Practices**. Inspector scans for vulnerabilities, Macie finds sensitive data, and Artifact provides AWS compliance reports.',
  },
  {
    id: 'sec-093',
    domain: 'security-compliance',
    question: 'Which statement correctly compares AWS KMS and AWS CloudHSM?',
    options: [
      'AWS KMS provides dedicated single-tenant HSMs, and CloudHSM is a shared managed service',
      'Both services require the customer to install and maintain the HSM hardware',
      'CloudHSM provides dedicated HSMs in the customer VPC that the customer controls, while KMS is a fully managed service where AWS operates the HSMs',
      'CloudHSM is mainly used to issue public SSL/TLS certificates',
    ],
    answer: [2],
    explanation:
      '**CloudHSM** gives you **dedicated HSMs** in your VPC, and you manage the keys and HSM users, while **KMS** is a **fully managed** key service where AWS operates the underlying HSMs. AWS maintains the hardware for both, and public certificates are issued by ACM.',
  },
  {
    id: 'sec-094',
    domain: 'security-compliance',
    question:
      'A developer accidentally committed IAM user access keys to a public code repository. What should the company do FIRST?',
    options: [
      'Delete the repository and keep using the same keys',
      'Contact AWS Marketplace to report the leak',
      'Enable AWS Shield Advanced on the account',
      'Deactivate the exposed access keys immediately and replace them with new ones',
    ],
    answer: [3],
    explanation:
      'Exposed credentials must be **deactivated (and then deleted) immediately** and replaced, because copies may already exist even if the repository is deleted. AWS Marketplace does not handle credential leaks, and Shield Advanced protects against DDoS, not stolen keys.',
  },
  {
    id: 'sec-095',
    domain: 'security-compliance',
    question: 'Which actions provide encryption of data at rest? (Choose two.)',
    options: [
      'Enable encryption on Amazon EBS volumes with AWS KMS keys',
      'Enable encryption for an Amazon RDS DB instance',
      'Configure an HTTPS listener on an Application Load Balancer',
      'Connect to the VPC through AWS Site-to-Site VPN',
      'Require TLS for calls to an Amazon API Gateway endpoint',
    ],
    answer: [0, 1],
    explanation:
      '**EBS encryption** and **RDS encryption** protect stored data **at rest** using KMS keys. HTTPS listeners, Site-to-Site VPN and TLS all protect data **in transit**.',
  },
  {
    id: 'sec-096',
    domain: 'security-compliance',
    question: 'Who owns and controls the content that a customer stores in AWS?',
    options: [
      'The customer retains ownership and control of its content',
      'AWS owns all content stored in its data centers',
      'Ownership is shared equally between AWS and the customer',
      'The government of the country where the Region is located',
    ],
    answer: [0],
    explanation:
      'AWS states that **customers own and control their content**, including where it is stored and how it is secured. AWS does not take ownership of customer content, and ownership is not shared or transferred to a government.',
  },
  {
    id: 'sec-097',
    domain: 'security-compliance',
    question: 'A company uses Amazon DynamoDB. Which task is the responsibility of the company?',
    options: [
      'Patching the database software',
      'Managing access to tables with IAM policies',
      'Replicating data across multiple Availability Zones',
      'Maintaining the servers that host the tables',
    ],
    answer: [1],
    explanation:
      'DynamoDB is fully managed, so the customer mainly handles **access control (IAM)**, data and configuration such as encryption settings. AWS patches the software, maintains the servers, and automatically replicates data across multiple Availability Zones in a Region.',
  },
  {
    id: 'sec-098',
    domain: 'security-compliance',
    question:
      'The root user of a member account in AWS Organizations tries to perform an action that is denied by an SCP attached to the account. What happens?',
    options: [
      'The action is allowed because the root user bypasses all policies',
      'The action is allowed only if the root user signed in with MFA',
      'The action is denied because SCPs apply to all users and roles in member accounts, including the root user',
      'The action is denied only for IAM users, and the root user is not affected',
    ],
    answer: [2],
    explanation:
      'SCPs affect **all IAM users and roles in member accounts, including the root user** of those accounts. The root user cannot bypass an SCP, and MFA has no effect on an SCP deny (SCPs do not apply to the management account).',
  },
  {
    id: 'sec-099',
    domain: 'security-compliance',
    question:
      'In AWS IAM Identity Center, what defines the level of access that users and groups receive in an assigned AWS account?',
    options: ['Security groups', 'Network ACLs', 'IAM password policies', 'Permission sets'],
    answer: [3],
    explanation:
      'In IAM Identity Center, a **permission set** is a collection of policies that defines what a user or group can do when assigned to an AWS account. Security groups and network ACLs control network traffic, and password policies control IAM user passwords.',
  },
  {
    id: 'sec-100',
    domain: 'security-compliance',
    question:
      'A company runs a web server on Amazon EC2. Which of the following are the responsibility of the company? (Choose two.)',
    options: [
      'Physical security of the host hardware',
      'Patching the hypervisor',
      'Configuring security groups and the OS-level firewall',
      'Installing and updating the application software on the instance',
      'Decommissioning failed storage devices',
    ],
    answer: [2, 3],
    explanation:
      'With EC2 the customer manages **network access controls such as security groups and host firewalls** and the **software installed on the instance**. Physical hardware, the hypervisor, and storage device decommissioning are AWS responsibilities.',
  },
  {
    id: 'sec-101',
    domain: 'security-compliance',
    question:
      'A company wants to limit how many requests a single IP address can send to its website on Amazon CloudFront, to reduce HTTP flood attacks. What should it use?',
    options: ['AWS WAF rate-based rules', 'Security groups', 'Network ACLs', 'Amazon Inspector'],
    answer: [0],
    explanation:
      '**AWS WAF rate-based rules** track requests per IP address and block or limit addresses that exceed a threshold, which helps with layer 7 floods. Security groups and network ACLs cannot be applied to CloudFront and do not count requests, and Inspector scans for vulnerabilities.',
  },
  {
    id: 'sec-102',
    domain: 'security-compliance',
    question: 'AWS Firewall Manager requires which of the following to be in place?',
    options: ['Amazon Macie', 'AWS Organizations', 'Amazon Detective', 'AWS Artifact'],
    answer: [1],
    explanation:
      'Firewall Manager manages policies across accounts, so it requires the accounts to be members of an **AWS Organizations** organization (plus AWS Config enabled). Macie, Detective and Artifact are not prerequisites.',
  },
  {
    id: 'sec-103',
    domain: 'security-compliance',
    question:
      'A developer has hardcoded a database password in application source code. What is the BEST way to remove it from the code?',
    options: [
      'Store the password in a plain text file in an S3 bucket',
      'Put the password into an AWS Certificate Manager certificate',
      'Store the password in AWS Secrets Manager and retrieve it at runtime',
      'Put the password into the EC2 instance user data',
    ],
    answer: [2],
    explanation:
      '**AWS Secrets Manager** stores the secret encrypted, controls access with IAM, and lets the application **retrieve it at runtime** (and rotate it). A plain text file or user data still exposes the password, and ACM certificates cannot hold passwords.',
  },
  {
    id: 'sec-104',
    domain: 'security-compliance',
    question:
      'A company wants to centralize security data from AWS services, on-premises systems, and SaaS sources into a data lake in its own account, normalized to the Open Cybersecurity Schema Framework (OCSF). Which AWS service should it use?',
    options: ['AWS Security Hub', 'Amazon Detective', 'Amazon GuardDuty', 'Amazon Security Lake'],
    answer: [3],
    explanation:
      '**Amazon Security Lake** collects security data into a purpose-built data lake in Amazon S3 in your account and normalizes it to **OCSF**. Security Hub aggregates findings and runs checks, Detective investigates findings, and GuardDuty detects threats.',
  },
  {
    id: 'sec-105',
    domain: 'security-compliance',
    question: 'Which of the following can Amazon GuardDuty detect? (Choose two.)',
    options: [
      'Unencrypted personally identifiable information in S3 objects',
      'An EC2 instance communicating with a known malicious IP address',
      'TLS certificates that are close to expiring',
      'Unusual API activity, such as calls from an unexpected location using an IAM user credential',
      'Known software vulnerabilities in container images',
    ],
    answer: [1, 3],
    explanation:
      'GuardDuty detects threats such as **communication with known malicious IPs** and **anomalous API activity** that can indicate compromised credentials. PII discovery is Macie, certificate expiry is tracked by ACM, and container image vulnerabilities are found by Inspector.',
  },
  {
    id: 'sec-106',
    domain: 'security-compliance',
    question:
      'A company wants administrators to get shell access to EC2 instances without opening inbound SSH ports or managing SSH keys. Which AWS capability should it use?',
    options: [
      'AWS Systems Manager Session Manager',
      'EC2 key pairs with port 22 open to 0.0.0.0/0',
      'A network ACL that allows port 22 from anywhere',
      'IAM Access Analyzer',
    ],
    answer: [0],
    explanation:
      '**Session Manager** provides shell access through the Systems Manager agent, controlled by IAM and logged, with **no inbound ports or SSH keys** required. Opening port 22 to everyone increases exposure, and IAM Access Analyzer analyzes access policies rather than providing shell access.',
  },
  {
    id: 'sec-107',
    domain: 'security-compliance',
    question:
      'A company requires that data be encrypted before it leaves its own systems so that AWS never handles the plaintext. Which approach meets this requirement?',
    options: [
      'Server-side encryption with Amazon S3 managed keys (SSE-S3)',
      'Client-side encryption',
      'Using TLS for the upload only',
      'Enabling S3 Versioning',
    ],
    answer: [1],
    explanation:
      'With **client-side encryption**, data is encrypted by the customer before it is sent, so AWS receives only ciphertext. Server-side encryption happens after AWS receives the data, TLS protects data only in transit and AWS decrypts it on arrival, and versioning is not encryption.',
  },
  {
    id: 'sec-108',
    domain: 'security-compliance',
    question:
      'A company wants to log all API activity from every account in its organization to one central Amazon S3 bucket. What should it do?',
    options: [
      'Enable Amazon GuardDuty in every account',
      'Create an AWS Config rule in each account',
      'Create an organization trail in AWS CloudTrail',
      'Enable Amazon Macie for the central bucket',
    ],
    answer: [2],
    explanation:
      'An **organization trail** in CloudTrail logs events for **all accounts** in an AWS Organizations organization to a central S3 bucket. GuardDuty detects threats, AWS Config rules evaluate configurations, and Macie finds sensitive data; none of these collect all API activity.',
  },
  {
    id: 'sec-109',
    domain: 'security-compliance',
    question: 'Which is a best practice for IAM user access keys?',
    options: [
      'Embed access keys in application source code for convenience',
      'Share access keys between developers who work on the same project',
      'Never rotate access keys so applications are not disrupted',
      'Rotate access keys regularly and remove keys that are not used',
    ],
    answer: [3],
    explanation:
      'AWS recommends **rotating access keys** and **removing unused keys**, and preferring roles with temporary credentials where possible. Embedding keys in code, sharing them, or never rotating them increases the risk of compromise.',
  },
  {
    id: 'sec-110',
    domain: 'security-compliance',
    question:
      'Which AWS resources can a customer use to find security guidance and answers to common security questions? (Choose two.)',
    options: [
      'AWS Security Blog',
      'AWS Pricing Calculator',
      'AWS Cost Explorer',
      'AWS Compute Optimizer',
      'AWS Knowledge Center',
    ],
    answer: [0, 4],
    explanation:
      'The **AWS Security Blog** publishes security guidance and announcements, and the **AWS Knowledge Center** answers frequently asked questions, including security topics. Pricing Calculator and Cost Explorer are cost tools, and Compute Optimizer gives right-sizing recommendations.',
  },
];
