import type { ExamQuestion } from '../../types';

// Reviewed questions drafted from a CLF-C02 course, deduplicated against the rest of the bank.
export const courseReviewQuestions: ExamQuestion[] = [
  {
    id: 'cr-001',
    domain: 'cloud-concepts',
    question:
      'A developer wants to upload application code and have the platform handle capacity provisioning, load balancing and the operating system. Which cloud service model does AWS Elastic Beanstalk represent?',
    options: [
      'Platform as a Service (PaaS)',
      'Infrastructure as a Service (IaaS)',
      'Software as a Service (SaaS)',
      'Desktop as a Service (DaaS)',
    ],
    answer: [0],
    explanation:
      'Elastic Beanstalk is **PaaS**: developers deploy code and AWS manages the underlying platform. IaaS would require managing servers and the OS yourself, SaaS is a finished end-user application, and DaaS delivers virtual desktops.',
  },
  {
    id: 'cr-002',
    domain: 'cloud-concepts',
    question:
      'Which compute model makes the customer responsible only for their code and data, and bills only for the time the code is running?',
    options: [
      'Dedicated physical servers',
      'Serverless functions with AWS Lambda',
      'Virtual machines on Amazon EC2',
      'Containers on a self-managed EC2 cluster',
    ],
    answer: [1],
    explanation:
      'With **serverless functions** such as AWS Lambda, AWS manages the servers and runtime environment and you pay only while your code executes. Dedicated servers, EC2 virtual machines and self-managed container hosts all require you to provision and pay for capacity whether or not it is used.',
  },
  {
    id: 'cr-003',
    domain: 'cloud-concepts',
    question:
      'An e-commerce site needs its infrastructure to automatically add capacity during a flash sale and remove it when traffic drops. Which cloud characteristic does this describe?',
    options: [
      'Fault tolerance',
      'Durability',
      'Elasticity',
      'Data sovereignty',
    ],
    answer: [2],
    explanation:
      '**Elasticity** is the ability to automatically grow and shrink resources to match demand. Fault tolerance is about continuing to operate during a failure, durability is about not losing stored data, and data sovereignty concerns the laws that apply to data.',
  },
  {
    id: 'cr-004',
    domain: 'cloud-concepts',
    question:
      'An administrator changes an EC2 instance from a small instance type to a much larger instance type to handle more load. What is this an example of?',
    options: [
      'Horizontal scaling (scaling out)',
      'Scaling in',
      'Elastic load balancing',
      'Vertical scaling (scaling up)',
    ],
    answer: [3],
    explanation:
      'Moving to a bigger server is **vertical scaling**, or scaling up. Horizontal scaling adds more servers of the same size, scaling in removes servers, and load balancing distributes traffic rather than changing server size.',
  },
  {
    id: 'cr-005',
    domain: 'cloud-concepts',
    question:
      'A business continuity plan states that after a disruption, the application must be back in service within 4 hours. Which objective does this requirement define?',
    options: [
      'Recovery time objective (RTO)',
      'Recovery point objective (RPO)',
      'Service level indicator (SLI)',
      'Mean time between failures (MTBF)',
    ],
    answer: [0],
    explanation:
      'The **RTO** is the maximum acceptable delay between service interruption and restoration. The RPO measures acceptable data loss as time since the last recovery point, while SLI and MTBF are not the disaster recovery objectives defined in a BCP.',
  },
  {
    id: 'cr-006',
    domain: 'cloud-concepts',
    question:
      'Which disaster recovery strategy has the lowest cost but the longest recovery time, because infrastructure is redeployed and data restored only after a disaster occurs?',
    options: [
      'Warm standby',
      'Backup and restore',
      'Pilot light',
      'Multi-site active/active',
    ],
    answer: [1],
    explanation:
      '**Backup and restore** keeps only backups and rebuilds after the event, so it is the cheapest with RPO/RTO in hours. Pilot light, warm standby and multi-site keep progressively more infrastructure running, which costs more but recovers faster.',
  },
  {
    id: 'cr-007',
    domain: 'cloud-concepts',
    question:
      'A company replicates its data to a second AWS Region and keeps only core services, such as the database, running there. Application servers are started and scaled only when a disaster occurs. Which disaster recovery strategy is this?',
    options: [
      'Backup and restore',
      'Multi-site active/active',
      'Pilot light',
      'Warm standby',
    ],
    answer: [2],
    explanation:
      '**Pilot light** keeps data replicated and a minimal core running, then provisions and scales the rest after an event. Warm standby runs a scaled-down but fully functional copy, multi-site runs a full-scale copy, and backup and restore keeps nothing running.',
  },
  {
    id: 'cr-008',
    domain: 'cloud-concepts',
    question:
      'A company runs a scaled-down but fully functional copy of its production environment in another Region. During a disaster, it scales this environment up to full capacity. Which strategy is being used?',
    options: [
      'Backup and restore',
      'Pilot light',
      'Multi-site active/active',
      'Warm standby',
    ],
    answer: [3],
    explanation:
      '**Warm standby** is an always-running, scaled-down full copy that is scaled up on failover, giving recovery in minutes. Pilot light runs only core services, and multi-site active/active already runs at full scale in both locations.',
  },
  {
    id: 'cr-009',
    domain: 'cloud-concepts',
    question:
      'A mission-critical application must have near-zero downtime and near-zero data loss, and the company accepts the highest infrastructure cost to achieve this. Which disaster recovery strategy meets these needs?',
    options: [
      'Multi-site active/active',
      'Pilot light',
      'Warm standby',
      'Backup and restore',
    ],
    answer: [0],
    explanation:
      '**Multi-site active/active** runs a full-scale copy serving traffic in another Region, giving near-zero RPO and RTO at the highest cost. The other strategies are cheaper but involve some downtime while resources are restored or scaled.',
  },
  {
    id: 'cr-010',
    domain: 'cloud-concepts',
    question:
      'An online store\'s business continuity plan states that after a failure it can afford to lose at most 15 minutes of order data. Which objective does this requirement define?',
    options: [
      'Recovery time objective (RTO)',
      'Recovery point objective (RPO)',
      'Service level agreement (SLA)',
      'Mean time to repair (MTTR)',
    ],
    answer: [1],
    explanation:
      'The **recovery point objective (RPO)** is the maximum acceptable data loss, measured as time since the last recovery point, so it drives how often data is backed up or replicated. The RTO is the maximum acceptable downtime, an SLA is a provider\'s uptime commitment, and MTTR measures average repair time rather than tolerable data loss.',
  },
  {
    id: 'cr-011',
    domain: 'cloud-concepts',
    question:
      'How does a microservices architecture differ from a monolithic architecture?',
    options: [
      'Microservices run every function in one tightly coupled application on a single server',
      'Microservices require all components to share one database schema and release cycle',
      'Microservices split an application into small, independently deployable services that each handle one function',
      'Microservices can only be built with virtual machines, not containers',
    ],
    answer: [2],
    explanation:
      '**Microservices** break an application into small, loosely coupled services that each do one job and can be deployed and scaled independently. A tightly coupled single application is a monolith, shared schemas and release cycles create coupling, and microservices commonly use containers and serverless.',
  },
  {
    id: 'cr-012',
    domain: 'cloud-concepts',
    question:
      'Which AWS CAF perspective is commonly led by the CTO, technology leaders and architects, and focuses on building an enterprise-grade, scalable cloud platform and modernizing workloads?',
    options: [
      'Business',
      'Security',
      'People',
      'Platform',
    ],
    answer: [3],
    explanation:
      'The **Platform** perspective covers the technical architecture and delivery of cloud solutions. Business focuses on business value, Security on controls and compliance, and People on skills and culture.',
  },
  {
    id: 'cr-013',
    domain: 'cloud-concepts',
    question:
      'Which design principle belongs to the Reliability pillar of the AWS Well-Architected Framework?',
    options: [
      'Scale horizontally to increase aggregate workload availability',
      'Democratize advanced technologies',
      'Adopt a consumption model',
      'Perform operations as code',
    ],
    answer: [0],
    explanation:
      '**Scale horizontally** to avoid a single point of failure is a Reliability principle. Democratizing advanced technologies is Performance Efficiency, adopting a consumption model is Cost Optimization, and operations as code is Operational Excellence.',
  },
  {
    id: 'cr-014',
    domain: 'cloud-concepts',
    question:
      'Which characteristic is typical of serverless services such as AWS Lambda and Amazon DynamoDB on-demand?',
    options: [
      'You choose and patch the operating system',
      'Costs can scale to zero when there is no usage',
      'You pay for a fixed number of servers each month',
      'You must manually add capacity before traffic spikes',
    ],
    answer: [1],
    explanation:
      'Serverless services abstract the servers and typically **scale to zero**, so you pay for usage rather than idle capacity. Patching the OS, paying for fixed servers and manual capacity planning describe server-based models.',
  },
  {
    id: 'cr-015',
    domain: 'cloud-concepts',
    question:
      'Which of the following is an example of operational expenditure (OpEx)?',
    options: [
      'Buying rack servers for a new on-premises data center',
      'Purchasing network switches that will be depreciated over five years',
      'Paying each month for the compute hours an application uses on AWS',
      'Constructing a cooling system for a server room',
    ],
    answer: [2],
    explanation:
      'Pay-as-you-go cloud usage is an **operational expense** paid as it is consumed. Buying servers, switches or building data center facilities are upfront **capital expenditures** that must be planned and depreciated.',
  },
  {
    id: 'cr-016',
    domain: 'cloud-concepts',
    question:
      'AWS fails to meet the monthly uptime commitment in a service\'s Service Level Agreement, and the customer files a claim. What does the customer typically receive?',
    options: [
      'A free upgrade to a higher support plan',
      'A cash refund of the entire year\'s charges',
      'Dedicated hardware at no extra cost',
      'Service credits applied to future AWS bills',
    ],
    answer: [3],
    explanation:
      'AWS SLAs compensate missed commitments with **service credits**, a percentage of that service\'s charges for the period that grows as uptime falls. They do not provide support upgrades, full-year refunds or dedicated hardware.',
  },
  {
    id: 'cr-017',
    domain: 'security-compliance',
    question:
      'A company uses AWS Direct Connect and has a requirement that all data in transit between its data center and AWS be encrypted. What should it do?',
    options: [
      'Establish an AWS Site-to-Site VPN connection over the Direct Connect link',
      'Nothing, because Direct Connect encrypts all traffic by default',
      'Enable Amazon S3 Transfer Acceleration',
      'Move the workload into an AWS Local Zone',
    ],
    answer: [0],
    explanation:
      'Direct Connect is **private but not encrypted by default**, so running a **Site-to-Site VPN over Direct Connect** (or using MACsec where supported) adds encryption. Transfer Acceleration only speeds S3 uploads, and Local Zones reduce latency but do not encrypt traffic.',
  },
  {
    id: 'cr-018',
    domain: 'security-compliance',
    question:
      'A contractor must host workloads subject to ITAR and FedRAMP High requirements in Regions operated only by screened US citizens. Which AWS offering meets this need?',
    options: [
      'AWS Local Zones',
      'AWS GovCloud (US)',
      'US East (N. Virginia) us-east-1',
      'AWS Wavelength',
    ],
    answer: [1],
    explanation:
      '**AWS GovCloud (US)** Regions are isolated Regions built for sensitive US government and regulated workloads such as ITAR and FedRAMP High, operated by screened US citizens. Standard commercial Regions, Local Zones and Wavelength Zones do not carry these specific operating guarantees.',
  },
  {
    id: 'cr-019',
    domain: 'security-compliance',
    question:
      'Which term describes the legal authority that can be asserted over data because it is physically stored within a particular jurisdiction?',
    options: [
      'Data residency',
      'Data durability',
      'Data sovereignty',
      'Data lineage',
    ],
    answer: [2],
    explanation:
      '**Data sovereignty** refers to the laws and legal authority that apply to data because of where it physically resides. Data residency is simply the physical location of data, durability is about not losing data, and lineage tracks where data came from and how it changed.',
  },
  {
    id: 'cr-020',
    domain: 'security-compliance',
    question:
      'A company needs to install its own hypervisor directly on AWS hardware. Which EC2 option allows this?',
    options: [
      'Dedicated Instances',
      'Spot Instances',
      'Amazon Lightsail instances',
      'EC2 bare metal instances',
    ],
    answer: [3],
    explanation:
      '**Bare metal instances** give access to the underlying server, so the customer can manage the host OS and hypervisor. Dedicated Instances provide single-tenant isolation but still run on the AWS hypervisor, and Spot and Lightsail are ordinary virtualized options.',
  },
  {
    id: 'cr-021',
    domain: 'security-compliance',
    question:
      'An administrator gave an employee broad IAM permissions, and the employee accidentally deleted production data. According to the shared responsibility model, who is responsible?',
    options: [
      'The customer, because it granted the permissions',
      'AWS, because it operates IAM',
      'AWS Support, because it should have prevented the deletion',
      'No one, because IAM actions are not covered',
    ],
    answer: [0],
    explanation:
      'Granting access and configuring permissions is security **in** the cloud, so the **customer** is responsible for over-permissive grants. AWS operates the IAM service itself but does not decide who receives which permissions.',
  },
  {
    id: 'cr-022',
    domain: 'security-compliance',
    question:
      'A company is creating an IAM role so that users in a partner\'s AWS account can access its resources. What must it specify to identify the trusted account?',
    options: [
      'The partner account\'s root user email address',
      'The partner account\'s 12-digit AWS account ID',
      'The partner\'s AWS Region',
      'The partner\'s billing address',
    ],
    answer: [1],
    explanation:
      'Cross-account roles trust another account by its **12-digit account ID**. Email addresses, Regions and billing details are not used to establish IAM trust relationships.',
  },
  {
    id: 'cr-023',
    domain: 'security-compliance',
    question:
      'A developer created an IAM access key but lost the secret access key. What should the developer do?',
    options: [
      'Retrieve it from the IAM console\'s security credentials tab',
      'Ask AWS Support to recover it',
      'Create a new access key and delete the old one',
      'Reset the root user password to reveal it',
    ],
    answer: [2],
    explanation:
      'The secret access key is shown **only once at creation**, so a lost secret cannot be recovered; you **create a new key** and remove the old one. Neither the console nor AWS Support can display an existing secret.',
  },
  {
    id: 'cr-024',
    domain: 'security-compliance',
    question:
      'A user needs to give a partner temporary download access to one private object in Amazon S3 without making the bucket public or creating IAM users. What should the user do?',
    options: [
      'Turn off S3 Block Public Access',
      'Enable an object ACL for public read',
      'Attach a bucket policy allowing all principals',
      'Generate a presigned URL with an expiration time',
    ],
    answer: [3],
    explanation:
      'A **presigned URL** grants time-limited access to a specific private object and stops working after it expires. Disabling Block Public Access, public ACLs or an open bucket policy would expose data publicly and goes against least privilege.',
  },
  {
    id: 'cr-025',
    domain: 'security-compliance',
    question:
      'Which Amazon S3 feature is enabled by default on new buckets to help prevent data from accidentally being made public?',
    options: [
      'S3 Block Public Access',
      'S3 Object Lock',
      'S3 Transfer Acceleration',
      'S3 Cross-Region Replication',
    ],
    answer: [0],
    explanation:
      '**S3 Block Public Access** is turned on by default and must be deliberately disabled before public access can be granted. Object Lock prevents deletion, Transfer Acceleration speeds uploads, and replication copies objects; none of them block public access.',
  },
  {
    id: 'cr-026',
    domain: 'security-compliance',
    question:
      'A company must ensure that objects in an S3 bucket cannot be overwritten or permanently deleted, even by someone using compromised credentials, for a set retention period. Which S3 features should it use? (Choose two.)',
    options: [
      'S3 Versioning',
      'S3 Transfer Acceleration',
      'S3 Object Lock',
      'S3 Intelligent-Tiering',
      'S3 presigned URLs',
    ],
    answer: [0, 2],
    explanation:
      '**S3 Object Lock** provides write-once-read-many (WORM) protection, and it requires **S3 Versioning** to be enabled, which also preserves prior versions. Transfer Acceleration, Intelligent-Tiering and presigned URLs address speed, cost and temporary access, not deletion protection.',
  },
  {
    id: 'cr-027',
    domain: 'security-compliance',
    question:
      'A company wants applications in its VPC to access a supported AWS service privately so that traffic never traverses the public internet. Which feature should it use?',
    options: [
      'Internet gateway',
      'AWS PrivateLink interface endpoint',
      'Elastic IP address',
      'Amazon CloudFront origin access control',
    ],
    answer: [1],
    explanation:
      '**AWS PrivateLink** (VPC interface endpoints) keeps traffic between your VPC and services on the AWS network. An internet gateway and Elastic IPs are for public internet access, and origin access control secures CloudFront access to S3 origins.',
  },
  {
    id: 'cr-028',
    domain: 'security-compliance',
    question:
      'Because of licensing restrictions, a company must prevent users in certain countries from accessing videos delivered through Amazon CloudFront. Which feature should it use?',
    options: [
      'CloudFront cache invalidation',
      'S3 Block Public Access',
      'CloudFront geographic restrictions',
      'Amazon Route 53 weighted routing',
    ],
    answer: [2],
    explanation:
      '**CloudFront geographic restrictions** use an allow list or block list of countries to control who can access content. Invalidations remove cached files, Block Public Access controls bucket exposure, and weighted routing splits DNS traffic rather than blocking countries.',
  },
  {
    id: 'cr-029',
    domain: 'security-compliance',
    question:
      'In a zero trust security model, what becomes the primary security perimeter?',
    options: [
      'The corporate network firewall',
      'The office VPN',
      'The physical data center',
      'Identity',
    ],
    answer: [3],
    explanation:
      'Zero trust assumes no user or device is trusted by default, so **identity** (with controls like MFA and context-based conditions) becomes the primary perimeter. Firewalls, VPNs and physical security are network-centric or physical controls that zero trust adds to rather than relies on.',
  },
  {
    id: 'cr-030',
    domain: 'security-compliance',
    question:
      'Which open standard is commonly used to exchange authentication and authorization data between an identity provider and a service provider for web-browser single sign-on into the AWS Management Console?',
    options: [
      'SAML 2.0',
      'LDAP',
      'SMTP',
      'OAuth 2.0 client credentials',
    ],
    answer: [0],
    explanation:
      '**SAML 2.0** passes assertions from an identity provider to a service provider and is widely used for browser-based SSO, including federation into AWS. LDAP is a directory access protocol, SMTP sends email, and OAuth 2.0 is for authorization rather than browser SSO assertions.',
  },
  {
    id: 'cr-031',
    domain: 'security-compliance',
    question:
      'Which tasks can be performed ONLY by the AWS account root user? (Choose two.)',
    options: [
      'Create an IAM group',
      'Change the account\'s root user email address',
      'Attach a managed policy to an IAM role',
      'Close the AWS account',
      'Create a VPC',
    ],
    answer: [1, 3],
    explanation:
      'Changing **account settings such as the root email address** and **closing the account** are root-user-only tasks. Creating IAM groups, attaching policies and creating VPCs can be done by any IAM identity with the right permissions, and the root user should not be used for them.',
  },
  {
    id: 'cr-032',
    domain: 'security-compliance',
    question:
      'Which IAM policy statement elements specify whether access is allowed or denied and which API operations the statement covers? (Choose two.)',
    options: [
      'Sid',
      'Version',
      'Effect',
      'Principal',
      'Action',
    ],
    answer: [2, 4],
    explanation:
      '**Effect** is `Allow` or `Deny`, and **Action** lists the API operations, for example `s3:GetObject`. Sid is an optional label, Version is the policy language version, and Principal names who the policy applies to in resource-based policies.',
  },
  {
    id: 'cr-033',
    domain: 'security-compliance',
    question:
      'Which feature of AWS Control Tower automates the provisioning of new AWS accounts using pre-approved network and Region configurations?',
    options: [
      'Landing zone',
      'Account Factory',
      'Controls (guardrails)',
      'Conformance packs',
    ],
    answer: [1],
    explanation:
      '**Account Factory** standardizes and automates new account creation with pre-approved settings, optionally through AWS Service Catalog. The landing zone is the baseline environment, controls are governance rules, and conformance packs belong to AWS Config.',
  },
  {
    id: 'cr-034',
    domain: 'security-compliance',
    question:
      'A security team wants to quickly deploy a packaged set of AWS Config rules aligned to a framework such as CIS. What should they use?',
    options: [
      'An AWS Artifact report',
      'An Amazon Inspector assessment',
      'An AWS Config conformance pack',
      'An AWS Organizations tag policy',
    ],
    answer: [2],
    explanation:
      'A **conformance pack** is a collection of Config rules and remediation actions deployed as a single unit, with templates for frameworks like CIS and NIST. Artifact provides compliance reports, Inspector scans workloads, and tag policies standardize tags.',
  },
  {
    id: 'cr-035',
    domain: 'security-compliance',
    question:
      'Under the AWS penetration testing policy, which activities are NOT permitted without special approval? (Choose two.)',
    options: [
      'DNS zone walking via Amazon Route 53 hosted zones',
      'Vulnerability scanning of your own EC2 instances',
      'Testing your own Amazon API Gateway endpoints',
      'Protocol flooding against your resources',
      'Testing your own AWS Lambda functions',
    ],
    answer: [0, 3],
    explanation:
      'AWS prohibits **DNS zone walking through Route 53 hosted zones** and **port, protocol or request flooding** (and DoS testing outside the separate DDoS simulation policy). Testing your own EC2, API Gateway and Lambda resources is permitted without prior approval.',
  },
  {
    id: 'cr-036',
    domain: 'security-compliance',
    question:
      'Which statements about password hashing are correct? (Choose two.)',
    options: [
      'A hash can be reversed if you have the matching private key',
      'Hashing is a one-way function',
      'The same input produces a different hash every time',
      'Hashing requires a symmetric AES key',
      'Adding a salt helps defend against precomputed dictionary attacks',
    ],
    answer: [1, 4],
    explanation:
      'Hashing is **one-way** and deterministic, and a random **salt** stops attackers from matching hashes against precomputed dictionaries. Hashes cannot be decrypted with keys, identical unsalted inputs give the same output, and hashing does not use AES keys.',
  },
  {
    id: 'cr-037',
    domain: 'technology-services',
    question:
      'Which of the following factors should a company evaluate when choosing an AWS Region for a new workload? (Choose two.)',
    options: [
      'Data residency and regulatory compliance requirements',
      'Whether the Region supports AWS IAM',
      'The number of IAM users in the account',
      'The time zone of the company\'s billing team',
      'Network latency to the company\'s end users',
    ],
    answer: [0, 4],
    explanation:
      'The main factors are **compliance/data residency**, **latency to end users**, cost in that Region and which services are available there. IAM is a global service available everywhere, while IAM user counts and the billing team\'s time zone have no bearing on Region choice.',
  },
  {
    id: 'cr-038',
    domain: 'technology-services',
    question:
      'Which statements about Availability Zones within the same AWS Region are correct? (Choose two.)',
    options: [
      'They are all located inside the same building for low latency',
      'They are physically separated and supplied by independent power infrastructure',
      'They are connected to each other with high-bandwidth, low-latency networking',
      'They each belong to more than one Region at a time',
      'They share a single power substation to simplify failover',
    ],
    answer: [1, 2],
    explanation:
      'AZs are **physically separated** with independent power, cooling and substations, yet **linked by redundant low-latency networking** so workloads can span them. Putting them in one building or on one substation would defeat their isolation, and each AZ belongs to exactly one Region.',
  },
  {
    id: 'cr-039',
    domain: 'technology-services',
    question:
      'When launching an Amazon EC2 instance, which choice determines the Availability Zone where the instance runs?',
    options: [
      'The IAM role attached to the instance',
      'The AMI selected',
      'The security group selected',
      'The subnet selected',
    ],
    answer: [3],
    explanation:
      'Each **subnet** belongs to exactly one Availability Zone, so selecting a subnet places the instance in that AZ. IAM roles, AMIs and security groups are not tied to a specific AZ.',
  },
  {
    id: 'cr-040',
    domain: 'technology-services',
    question:
      'Users on several continents upload large video files to a single Amazon S3 bucket and complain about slow transfers. Which feature most directly speeds up these uploads?',
    options: [
      'Amazon S3 Transfer Acceleration',
      'S3 Lifecycle policies',
      'Amazon S3 Glacier Flexible Retrieval',
      'S3 Object Lock',
    ],
    answer: [0],
    explanation:
      '**S3 Transfer Acceleration** lets users upload to a nearby edge location, then moves the data over the AWS global network to the bucket. Lifecycle policies move objects between storage classes, Glacier is for archives, and Object Lock prevents deletion.',
  },
  {
    id: 'cr-041',
    domain: 'technology-services',
    question:
      'Which AWS services use edge locations to improve performance for end users? (Choose two.)',
    options: [
      'Amazon RDS Multi-AZ',
      'Amazon EBS',
      'AWS Outposts',
      'Amazon CloudFront',
      'AWS Global Accelerator',
    ],
    answer: [3, 4],
    explanation:
      '**CloudFront** caches and delivers content from edge locations, and **Global Accelerator** uses edge locations as entry points onto the AWS network. RDS Multi-AZ replicates across AZs in a Region, EBS is block storage attached within an AZ, and Outposts runs AWS infrastructure on-premises.',
  },
  {
    id: 'cr-042',
    domain: 'technology-services',
    question:
      'In the Amazon CloudFront architecture, which component holds larger caches of less frequently requested content between the origin and edge locations?',
    options: [
      'Availability Zone',
      'Regional edge cache',
      'Local Zone',
      'Direct Connect location',
    ],
    answer: [1],
    explanation:
      'A **regional edge cache** sits between the origin and edge locations and keeps a larger cache of less popular objects, reducing trips back to the origin. Availability Zones and Local Zones host compute resources, and Direct Connect locations provide private network connectivity.',
  },
  {
    id: 'cr-043',
    domain: 'technology-services',
    question:
      'Which statement about the AWS China Regions is correct?',
    options: [
      'They can be accessed with the same account credentials as AWS global Regions',
      'They are operated directly from AWS headquarters with no local partners',
      'They are isolated from AWS global Regions and require a separate account',
      'They offer exactly the same services as US East (N. Virginia)',
    ],
    answer: [2],
    explanation:
      'The AWS China Regions are **isolated from the AWS global Regions**, so they need separate accounts and credentials. They are operated by local Chinese partners rather than directly by AWS, and they do not offer every service that is available in other Regions.',
  },
  {
    id: 'cr-044',
    domain: 'technology-services',
    question:
      'A research team wants to experiment with quantum algorithms on real quantum hardware and simulators without buying any equipment. Which AWS service should it use?',
    options: [
      'Amazon SageMaker AI',
      'AWS Batch',
      'Amazon EMR',
      'Amazon Braket',
    ],
    answer: [3],
    explanation:
      '**Amazon Braket** is the managed quantum computing service giving access to quantum hardware providers and simulators. SageMaker AI is for machine learning, AWS Batch runs batch jobs on classical compute, and EMR runs big-data frameworks.',
  },
  {
    id: 'cr-045',
    domain: 'technology-services',
    question:
      'A company has an agreement with a satellite operator and needs to downlink imagery data directly into Amazon S3 without building its own antenna infrastructure. Which AWS service should it use?',
    options: [
      'AWS Ground Station',
      'AWS IoT Core',
      'Amazon Kinesis Video Streams',
      'AWS Outposts',
    ],
    answer: [0],
    explanation:
      '**AWS Ground Station** is a managed service for communicating with satellites and delivering downlinked data to EC2 or S3. IoT Core connects IoT devices, Kinesis Video Streams ingests video from cameras, and Outposts runs AWS on-premises.',
  },
  {
    id: 'cr-046',
    domain: 'technology-services',
    question:
      'A company wants to lower the cost of running machine learning inference using AWS-designed accelerator chips. Which EC2 instance family should it consider?',
    options: [
      'Instances powered by AWS Graviton',
      'Instances powered by AWS Inferentia',
      'Instances powered by Intel Xeon processors',
      'Instances powered by AWS Trainium',
    ],
    answer: [1],
    explanation:
      '**AWS Inferentia** chips are purpose-built for high-performance, low-cost machine learning **inference**. Graviton is a general-purpose Arm CPU, Intel Xeon is a general-purpose x86 CPU, and Trainium is optimized for **training** models rather than serving them.',
  },
  {
    id: 'cr-047',
    domain: 'technology-services',
    question:
      'How must programmatic requests sent directly to the AWS API be authenticated?',
    options: [
      'By sending the root user\'s email and password',
      'By whitelisting the caller\'s IP address in AWS Support',
      'By signing them with the caller\'s access key credentials',
      'By attaching the account ID as a query parameter',
    ],
    answer: [2],
    explanation:
      'AWS API requests are **signed** (Signature Version 4) using an access key ID and secret access key, which the CLI and SDKs do automatically. Passwords, IP allowlists and account IDs alone do not authenticate API calls.',
  },
  {
    id: 'cr-048',
    domain: 'technology-services',
    question:
      'Which identifier uniquely and unambiguously identifies a specific resource, such as an S3 bucket or load balancer, across all of AWS?',
    options: [
      'The AWS account ID',
      'A resource tag',
      'The access key ID',
      'The Amazon Resource Name (ARN)',
    ],
    answer: [3],
    explanation:
      'An **ARN** includes the partition, service, Region, account and resource, so it uniquely identifies a resource and is used in IAM policies, the CLI and the SDKs. An account ID identifies only an account, tags are non-unique labels, and an access key ID identifies credentials.',
  },
  {
    id: 'cr-049',
    domain: 'technology-services',
    question:
      'Developers want to write infrastructure as code in TypeScript or Python using reusable constructs, and deploy it through CloudFormation. Which tool fits best?',
    options: [
      'AWS Cloud Development Kit (AWS CDK)',
      'AWS CLI',
      'AWS Tools for PowerShell',
      'AWS CloudShell',
    ],
    answer: [0],
    explanation:
      'The **AWS CDK** lets you define infrastructure in familiar programming languages and synthesizes CloudFormation templates for deployment. The CLI and Tools for PowerShell run individual commands, and CloudShell is a browser-based shell.',
  },
  {
    id: 'cr-050',
    domain: 'technology-services',
    question:
      'A developer uses the AWS CLI with two different AWS accounts and wants to switch between them easily. What should the developer do?',
    options: [
      'Reinstall the CLI for each account',
      'Store each account\'s credentials as a named profile and select it with --profile',
      'Create a new IAM user each time the account changes',
      'Use the root user credentials for both accounts',
    ],
    answer: [1],
    explanation:
      'The credentials file (`~/.aws/credentials`) can hold multiple **named profiles**, and `--profile` chooses which one a command uses. Reinstalling, recreating users or using root credentials is unnecessary and insecure.',
  },
  {
    id: 'cr-051',
    domain: 'technology-services',
    question:
      'Which two statements describe AWS CloudShell? (Choose two.)',
    options: [
      'It comes with the AWS CLI and other tools preinstalled',
      'It is pre-authenticated with the credentials of the signed-in console user',
      'It requires you to launch and manage an EC2 instance',
      'It must be configured with downloaded access keys before use',
      'It only supports the PowerShell shell',
    ],
    answer: [0, 1],
    explanation:
      'CloudShell is a browser-based shell with **tools such as the AWS CLI preinstalled** and it **inherits the console user\'s credentials**, so no key setup is needed. AWS manages the environment, and it offers bash, zsh and PowerShell.',
  },
  {
    id: 'cr-052',
    domain: 'technology-services',
    question:
      'A Windows administrator wants to manage AWS resources using cmdlets in a familiar scripting environment. Which tool should the administrator use?',
    options: [
      'AWS CDK',
      'AWS Toolkit for VS Code',
      'AWS Tools for PowerShell',
      'Amazon Lightsail',
    ],
    answer: [2],
    explanation:
      '**AWS Tools for PowerShell** exposes the AWS API as PowerShell cmdlets such as `New-S3Bucket`. CDK is for infrastructure as code, the Toolkit for VS Code is an IDE extension, and Lightsail is a simple virtual server service.',
  },
  {
    id: 'cr-053',
    domain: 'technology-services',
    question:
      'Which AWS service automates application deployments to EC2 instances and supports blue/green deployments that shift traffic to a new environment?',
    options: [
      'AWS CodeBuild',
      'AWS CodeArtifact',
      'Amazon Route 53',
      'AWS CodeDeploy',
    ],
    answer: [3],
    explanation:
      '**AWS CodeDeploy** automates deployments to EC2, on-premises servers, Lambda and ECS, including **blue/green** deployments. CodeBuild compiles and tests code, CodeArtifact stores software packages, and Route 53 is a DNS service.',
  },
  {
    id: 'cr-054',
    domain: 'technology-services',
    question:
      'A team runs a containerized web API on Amazon ECS. The API must stay running continuously and failed containers must be replaced automatically. What should they create?',
    options: [
      'An ECS service',
      'A standalone ECS task',
      'An Amazon ECR repository',
      'An AWS Batch job queue',
    ],
    answer: [0],
    explanation:
      'An **ECS service** maintains a desired number of running tasks and replaces unhealthy ones, which suits long-running applications. A standalone task runs and then stops, ECR only stores container images, and AWS Batch is for batch jobs.',
  },
  {
    id: 'cr-055',
    domain: 'technology-services',
    question:
      'Which AWS technology combines dedicated hardware cards, a security chip and a lightweight hypervisor to deliver near bare-metal performance for modern EC2 instance types?',
    options: [
      'AWS Outposts',
      'AWS Nitro System',
      'Amazon Machine Images',
      'Elastic Fabric Adapter',
    ],
    answer: [1],
    explanation:
      'The **AWS Nitro System** consists of Nitro Cards, the Nitro Security Chip and the Nitro Hypervisor and underpins modern EC2 instances. Outposts is on-premises AWS hardware, AMIs are instance templates, and EFA is a network interface for HPC.',
  },
  {
    id: 'cr-056',
    domain: 'technology-services',
    question:
      'A research lab needs to quickly deploy and manage a high performance computing (HPC) cluster with a head node, compute nodes and a job scheduler on AWS. Which service should it use?',
    options: [
      'AWS Elastic Beanstalk',
      'Amazon EMR',
      'AWS ParallelCluster',
      'AWS App Runner',
    ],
    answer: [2],
    explanation:
      '**AWS ParallelCluster** is an AWS-supported open-source tool (the `pcluster` CLI) that deploys and manages HPC clusters. Elastic Beanstalk and App Runner deploy web applications, and EMR runs big data frameworks such as Spark.',
  },
  {
    id: 'cr-057',
    domain: 'technology-services',
    question:
      'A company wants to modify HTTP request headers at locations close to viewers before requests reach its origin, without managing servers. Which option should it use?',
    options: [
      'Amazon API Gateway private endpoints',
      'AWS Lambda in a single Region',
      'Amazon EC2 Auto Scaling',
      'Lambda@Edge with Amazon CloudFront',
    ],
    answer: [3],
    explanation:
      '**Lambda@Edge** (and lightweight **CloudFront Functions**) run code at CloudFront edge locations to inspect and modify requests and responses near users. A Regional Lambda function or API Gateway endpoint runs in one Region, and Auto Scaling manages EC2 capacity.',
  },
  {
    id: 'cr-058',
    domain: 'technology-services',
    question:
      'A company runs Apache Cassandra on premises and wants to move to a fully managed, serverless AWS service that is Cassandra-compatible. Which service should it use?',
    options: [
      'Amazon Keyspaces',
      'Amazon DocumentDB',
      'Amazon Timestream',
      'Amazon RDS for PostgreSQL',
    ],
    answer: [0],
    explanation:
      '**Amazon Keyspaces (for Apache Cassandra)** is a managed, serverless Cassandra-compatible database. DocumentDB is MongoDB-compatible, Timestream is for time-series data, and RDS for PostgreSQL is relational.',
  },
  {
    id: 'cr-059',
    domain: 'technology-services',
    question:
      'Thousands of IoT sensors send temperature readings every second, and the company needs to analyze how values change over time. Which purpose-built database should it use?',
    options: [
      'Amazon DocumentDB',
      'Amazon Timestream',
      'Amazon Aurora',
      'Amazon Neptune',
    ],
    answer: [1],
    explanation:
      '**Amazon Timestream** is a managed time-series database designed for measurements that change over time, such as IoT data. DocumentDB stores JSON documents, Aurora is relational, and Neptune stores graph relationships.',
  },
  {
    id: 'cr-060',
    domain: 'technology-services',
    question:
      'Which compute options let a company run workloads without provisioning or managing servers? (Choose two.)',
    options: [
      'Amazon EC2 On-Demand Instances',
      'AWS Outposts',
      'AWS Lambda',
      'AWS Fargate',
      'Amazon EC2 Dedicated Hosts',
    ],
    answer: [2, 3],
    explanation:
      '**AWS Lambda** runs functions and **AWS Fargate** runs containers without you managing servers. EC2 instances, Dedicated Hosts and Outposts all require you to choose and manage server capacity.',
  },
  {
    id: 'cr-061',
    domain: 'technology-services',
    question:
      'Which AWS database services are non-relational (NoSQL)? (Choose two.)',
    options: [
      'Amazon DynamoDB',
      'Amazon Aurora',
      'Amazon DocumentDB',
      'Amazon Redshift',
      'Amazon RDS for MariaDB',
    ],
    answer: [0, 2],
    explanation:
      '**Amazon DynamoDB** (key-value and document) and **Amazon DocumentDB** (MongoDB-compatible document) are NoSQL databases. Aurora and RDS for MariaDB are relational OLTP databases, and Redshift is a relational column-oriented data warehouse.',
  },
  {
    id: 'cr-062',
    domain: 'technology-services',
    question:
      'A company updated an image in its S3 origin, but users still see the old version served by Amazon CloudFront. What is the quickest way to make CloudFront serve the new file?',
    options: [
      'Enable S3 Versioning',
      'Change the S3 storage class',
      'Create a CloudFront invalidation for the file path',
      'Create a new VPC endpoint',
    ],
    answer: [2],
    explanation:
      'A **CloudFront invalidation** removes the cached object from edge locations so the next request fetches fresh content from the origin. Versioning and storage classes affect S3 only, and VPC endpoints are unrelated to CDN caching.',
  },
  {
    id: 'cr-063',
    domain: 'technology-services',
    question:
      'What does an EC2 instance type such as `m5.large` represent?',
    options: [
      'A pricing model and a commitment term',
      'An operating system and its preinstalled software',
      'A tenancy option and an Availability Zone',
      'A combination of an instance family and an instance size',
    ],
    answer: [3],
    explanation:
      'An instance type combines an **instance family** (e.g. m5) and an **instance size** (e.g. large), which together set CPU, memory, storage and network capacity. The OS and software come from the AMI, and pricing models and tenancy are separate choices.',
  },
  {
    id: 'cr-064',
    domain: 'technology-services',
    question:
      'An administrator stops and then starts an EC2 instance, and its public IPv4 address changes, which breaks a DNS record. What should be used to keep a fixed public IPv4 address?',
    options: [
      'An Elastic IP address',
      'A larger instance type',
      'A security group rule',
      'A launch template version',
    ],
    answer: [0],
    explanation:
      'An **Elastic IP address** is a static public IPv4 address that stays associated with your instance across stop/start. Instance type, security groups and launch templates do not control the public IP that is assigned when an instance starts.',
  },
  {
    id: 'cr-065',
    domain: 'technology-services',
    question:
      'A developer has installed and configured a web server on an EC2 instance and wants to launch identical servers later, even if the original is terminated. What should the developer create?',
    options: [
      'An Elastic IP address',
      'An Amazon Machine Image (AMI) of the instance',
      'A new key pair',
      'An EBS snapshot lifecycle report',
    ],
    answer: [1],
    explanation:
      'Creating an **AMI** captures the OS, installed software and configuration as a template for launching identical instances. An Elastic IP only keeps an address, a key pair only controls SSH access, and a report does not capture the server.',
  },
  {
    id: 'cr-066',
    domain: 'technology-services',
    question:
      'Which EC2 feature stores launch settings such as AMI, instance type, security groups and IAM instance profile, supports versioning, and is the recommended way to tell an Auto Scaling group what to launch?',
    options: [
      'Placement group',
      'Launch configuration',
      'Launch template',
      'Capacity Reservation',
    ],
    answer: [2],
    explanation:
      'A **launch template** holds versioned launch parameters and is the recommended source for Auto Scaling groups. Launch configurations are the older, non-versioned approach that AWS no longer recommends; placement groups and Capacity Reservations do not define what to launch.',
  },
  {
    id: 'cr-067',
    domain: 'technology-services',
    question:
      'An Auto Scaling group behind an Application Load Balancer keeps instances that are running but whose web application has stopped responding. What change will make the group replace these instances automatically?',
    options: [
      'Increase the maximum capacity of the group',
      'Enable scale-in protection',
      'Switch to a larger instance type',
      'Configure the group to use Elastic Load Balancing health checks',
    ],
    answer: [3],
    explanation:
      'By default an Auto Scaling group uses **EC2 status checks**, which only confirm the instance is running. Enabling **ELB health checks** makes it use the load balancer\'s application-level check and replace instances that fail it. Capacity changes, scale-in protection and instance size do not detect a failed application.',
  },
  {
    id: 'cr-068',
    domain: 'technology-services',
    question:
      'A team wants a fully managed GraphQL API that can pull data from DynamoDB and Lambda and push real-time updates to clients. Which service should it use?',
    options: [
      'AWS AppSync',
      'Amazon API Gateway REST API',
      'Amazon MQ',
      'Amazon EventBridge',
    ],
    answer: [0],
    explanation:
      '**AWS AppSync** is a managed GraphQL service where resolvers connect to sources such as DynamoDB and Lambda, and GraphQL subscriptions provide real-time updates. API Gateway REST APIs are not GraphQL-native, and Amazon MQ and EventBridge are messaging and event services.',
  },
  {
    id: 'cr-069',
    domain: 'technology-services',
    question:
      'A company places an Application Load Balancer in front of an Auto Scaling group. Which benefits does the load balancer provide? (Choose two.)',
    options: [
      'It removes the need for security groups',
      'It distributes incoming traffic across healthy instances in multiple Availability Zones',
      'It automatically purchases Reserved Instances for the group',
      'It can terminate HTTPS using certificates from AWS Certificate Manager',
      'It stores session data in Amazon S3 by default',
    ],
    answer: [1, 3],
    explanation:
      'An ALB **spreads traffic across healthy targets in multiple AZs** and can **terminate TLS with ACM certificates** (and integrate with AWS WAF). It does not replace security groups, buy Reserved Instances or store sessions in S3.',
  },
  {
    id: 'cr-070',
    domain: 'technology-services',
    question:
      'Which statements correctly compare Amazon SQS and Amazon SNS? (Choose two.)',
    options: [
      'SNS consumers must poll the topic for new messages',
      'SQS immediately pushes each message to every subscriber',
      'SNS pushes messages to all subscribers of a topic',
      'SQS and SNS both retain events so many consumers can replay them later',
      'SQS consumers poll a queue and delete messages after processing them',
    ],
    answer: [2, 4],
    explanation:
      '**SNS** is pub/sub: publishers send to a topic and messages are **pushed** to every subscriber. **SQS** is a queue: consumers **poll** for messages and delete them after processing. Neither is built for replaying retained events to many consumers; that is what streaming services like Kinesis do.',
  },
  {
    id: 'cr-071',
    domain: 'technology-services',
    question:
      'Which are valid states for an Amazon CloudWatch alarm? (Choose two.)',
    options: [
      'OK',
      'PENDING',
      'BREACHED',
      'INSUFFICIENT_DATA',
      'STOPPED',
    ],
    answer: [0, 3],
    explanation:
      'CloudWatch alarms have three states: **OK**, **ALARM** and **INSUFFICIENT_DATA**. PENDING, BREACHED and STOPPED are not alarm states.',
  },
  {
    id: 'cr-072',
    domain: 'technology-services',
    question:
      'An operations engineer wants to run ad hoc queries across application log groups already stored in CloudWatch Logs, without exporting them first. Which feature should they use?',
    options: [
      'Amazon Athena',
      'CloudWatch Logs Insights',
      'AWS Glue crawlers',
      'CloudWatch Dashboards',
    ],
    answer: [1],
    explanation:
      '**CloudWatch Logs Insights** lets you interactively query log groups in place with a purpose-built query language. Athena would require exporting logs to S3, Glue crawlers catalog data, and dashboards visualize metrics rather than query logs.',
  },
  {
    id: 'cr-073',
    domain: 'technology-services',
    question:
      'An administrator wants to view and manage all resources that share the tag Project=Apollo as a single collection. Which service should be used?',
    options: [
      'AWS Service Catalog',
      'AWS Control Tower',
      'AWS Resource Groups',
      'Amazon Inspector',
    ],
    answer: [2],
    explanation:
      '**AWS Resource Groups** build collections of resources based on shared tags or CloudFormation stacks. Service Catalog offers approved products, Control Tower governs accounts, and Inspector scans for vulnerabilities.',
  },
  {
    id: 'cr-074',
    domain: 'technology-services',
    question:
      'A company wants to bring its existing Microsoft Windows Server licenses, which are tied to physical cores, to AWS and track their usage. Which should it use? (Choose two.)',
    options: [
      'Amazon EC2 Spot Instances',
      'Amazon EC2 Dedicated Hosts',
      'AWS Marketplace',
      'AWS Budgets',
      'AWS License Manager',
    ],
    answer: [1, 4],
    explanation:
      'Core- or socket-bound Microsoft BYOL usually requires **Dedicated Hosts**, which expose the physical server, and **AWS License Manager** tracks license consumption. Spot Instances don\'t address licensing, Marketplace sells new software, and Budgets tracks spending.',
  },
  {
    id: 'cr-075',
    domain: 'technology-services',
    question:
      'A machine learning team needs humans to label thousands of images to create a training dataset. Which service helps manage this labeling work?',
    options: [
      'Amazon Rekognition',
      'Amazon Augmented AI (A2I)',
      'Amazon Textract',
      'Amazon SageMaker Ground Truth',
    ],
    answer: [3],
    explanation:
      '**SageMaker Ground Truth** manages data labeling with human workforces to build training datasets. Rekognition is a pre-trained vision service, A2I adds human review of low-confidence predictions, and Textract extracts document text.',
  },
  {
    id: 'cr-076',
    domain: 'technology-services',
    question:
      'A company wants to build a data-driven business case for migrating to AWS. It needs to inventory its on-premises servers with an agentless collector and project what running them on AWS would cost. Which service should it use?',
    options: [
      'Migration Evaluator',
      'AWS Database Migration Service',
      'VM Import/Export',
      'AWS Trusted Advisor',
    ],
    answer: [0],
    explanation:
      '**Migration Evaluator** (formerly TSO Logic) collects on-premises utilisation, often with an agentless collector, and projects AWS costs for a migration business case. DMS moves databases, VM Import/Export converts VM images to AMIs, and Trusted Advisor reviews existing AWS accounts.',
  },
  {
    id: 'cr-077',
    domain: 'technology-services',
    question:
      'A company has VMware virtual machine images it wants to run as Amazon EC2 instances without rebuilding them. Which AWS capability should it use?',
    options: [
      'AWS Schema Conversion Tool',
      'VM Import/Export',
      'AWS Database Migration Service',
      'AWS DataSync',
    ],
    answer: [1],
    explanation:
      '**VM Import/Export** imports VM images uploaded to S3 and produces an AMI you can launch as EC2. SCT converts database schemas, DMS migrates database data, and DataSync transfers files rather than converting VMs.',
  },
  {
    id: 'cr-078',
    domain: 'technology-services',
    question:
      'A team wants to roll out application feature flags and configuration changes gradually, validate them before deployment, and roll back automatically if errors rise. Which service should it use?',
    options: [
      'AWS Config',
      'AWS CloudFormation',
      'AWS AppConfig',
      'AWS Trusted Advisor',
    ],
    answer: [2],
    explanation:
      '**AWS AppConfig** deploys application configuration and feature flags with validators, controlled rollout and automatic rollback. AWS Config checks resource configuration compliance, CloudFormation provisions infrastructure, and Trusted Advisor gives recommendations.',
  },
  {
    id: 'cr-079',
    domain: 'technology-services',
    question:
      'A media company must convert thousands of stored video files into several streaming formats while adding watermarks and extracting captions. Which AWS service is recommended?',
    options: [
      'Amazon Elastic Transcoder',
      'AWS Elemental MediaConnect',
      'Amazon Kinesis Video Streams',
      'AWS Elemental MediaConvert',
    ],
    answer: [3],
    explanation:
      '**AWS Elemental MediaConvert** is the file-based video transcoding service, with features such as image overlays (watermarks) and caption extraction. Amazon Elastic Transcoder has been retired in favor of MediaConvert, MediaConnect transports live video feeds, and Kinesis Video Streams ingests streams from devices.',
  },
  {
    id: 'cr-080',
    domain: 'billing-support',
    question:
      'An administrator wants to create an Amazon CloudWatch alarm on the account\'s estimated charges. Which steps are required? (Choose two.)',
    options: [
      'Turn on receiving billing alerts in the Billing preferences',
      'Enable AWS CloudTrail in every Region',
      'Subscribe to a paid AWS Support plan',
      'Purchase a Savings Plan for the account',
      'Create the alarm in the US East (N. Virginia) Region where billing metrics are published',
    ],
    answer: [0, 4],
    explanation:
      'Billing metrics only appear after **enabling billing alerts** in Billing preferences, and the `EstimatedCharges` metric is published in **us-east-1**. CloudTrail, a paid Support plan and Savings Plans are not prerequisites for billing alarms.',
  },
  {
    id: 'cr-081',
    domain: 'billing-support',
    question:
      'A new application stored in Amazon DynamoDB has unpredictable, spiky traffic and the team does not want to plan read and write capacity. Which DynamoDB option should it use?',
    options: [
      'On-demand capacity mode',
      'Provisioned capacity mode',
      'DynamoDB Standard-IA table class',
      'Reserved capacity',
    ],
    answer: [0],
    explanation:
      '**On-demand capacity mode** charges per request and scales automatically, which suits unpredictable traffic without capacity planning. Provisioned mode and reserved capacity require you to estimate throughput, and the Standard-IA table class reduces storage cost but does not manage capacity.',
  },
  {
    id: 'cr-082',
    domain: 'billing-support',
    question:
      'Which choices made when purchasing Reserved Instances directly affect the size of the discount? (Choose two.)',
    options: [
      'The number of IAM users in the account',
      'The term length (1 year or 3 years)',
      'The payment option (All Upfront, Partial Upfront or No Upfront)',
      'The number of Availability Zones in the Region',
      'The amount of data stored in Amazon S3',
    ],
    answer: [1, 2],
    explanation:
      'RI savings grow with a **longer term** and **more payment upfront** (and with the less flexible Standard class). IAM users, the number of AZs and S3 storage have no effect on RI pricing.',
  },
  {
    id: 'cr-083',
    domain: 'billing-support',
    question:
      'Which AWS services do not charge for the service itself, although resources they create may be billed? (Choose two.)',
    options: [
      'Amazon EC2',
      'Amazon RDS',
      'AWS Shield Advanced',
      'AWS Identity and Access Management (IAM)',
      'AWS CloudFormation',
    ],
    answer: [3, 4],
    explanation:
      '**IAM** and **CloudFormation** have no charge of their own; with CloudFormation you pay for the resources the stack provisions. EC2, RDS and Shield Advanced are billed services.',
  },
];
