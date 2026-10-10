import type { ExamQuestion } from '../../types';

export const billingSupportQuestions: ExamQuestion[] = [
  {
    id: 'bill-001',
    domain: 'billing-support',
    question:
      'A startup is launching a new application with short-term, unpredictable traffic. The workload cannot be interrupted, and the company does not want to make any long-term commitment. Which EC2 pricing model fits best?',
    options: ['Spot Instances', 'Standard Reserved Instances', 'On-Demand Instances', 'Dedicated Hosts'],
    answer: [2],
    explanation:
      '**On-Demand Instances** have no commitment and cannot be interrupted by AWS, so they suit short-term, unpredictable workloads. Spot Instances can be interrupted, Standard Reserved Instances need a 1- or 3-year term, and Dedicated Hosts are physical servers for licensing or compliance needs, not a way to handle unpredictable usage cheaply.',
  },
  {
    id: 'bill-002',
    domain: 'billing-support',
    question:
      'A company runs nightly batch jobs that can be stopped and restarted at any time without affecting results. The company wants the lowest possible compute cost. Which EC2 purchasing option should it use?',
    options: ['Spot Instances', 'On-Demand Instances', 'Convertible Reserved Instances', 'On-Demand Capacity Reservations'],
    answer: [0],
    explanation:
      '**Spot Instances** use spare EC2 capacity at steep discounts and are ideal for fault-tolerant, interruptible work such as batch jobs. On-Demand is more expensive, Convertible Reserved Instances need a long-term commitment, and Capacity Reservations are billed at On-Demand rates to guarantee capacity rather than lower cost.',
  },
  {
    id: 'bill-003',
    domain: 'billing-support',
    question:
      'A company will run EC2 instances steadily for the next 3 years. It wants a Reserved Instance discount but expects to change to different instance families and operating systems over time. Which option should it buy?',
    options: [
      'Standard Reserved Instances',
      'Spot Instances',
      'Dedicated Instances',
      'Convertible Reserved Instances',
    ],
    answer: [3],
    explanation:
      '**Convertible Reserved Instances** can be exchanged for RIs with a different instance family, operating system or tenancy during the term. Standard RIs cannot change instance family, Spot Instances are not a reservation and can be interrupted, and Dedicated Instances are a tenancy option, not a discount model.',
  },
  {
    id: 'bill-004',
    domain: 'billing-support',
    question:
      'A company no longer needs some of its unused EC2 reservations and wants to sell them to another AWS customer through the Reserved Instance Marketplace. Which type of commitment can be sold there?',
    options: ['Convertible Reserved Instances', 'Standard Reserved Instances', 'Compute Savings Plans', 'Spot Instances'],
    answer: [1],
    explanation:
      'Only **Standard Reserved Instances** can be listed on the Reserved Instance Marketplace. Convertible RIs and Savings Plans cannot be resold, and Spot Instances are not a reservation at all.',
  },
  {
    id: 'bill-005',
    domain: 'billing-support',
    question:
      'A company runs workloads on Amazon EC2, AWS Fargate and AWS Lambda across several Regions. It wants one commitment that lowers the cost of all three, even if it changes instance families or Regions later. Which option meets this need?',
    options: [
      'EC2 Instance Savings Plans',
      'Standard Reserved Instances',
      'Compute Savings Plans',
      'Convertible Reserved Instances',
    ],
    answer: [2],
    explanation:
      '**Compute Savings Plans** apply automatically to EC2 usage regardless of instance family, size, Region, OS or tenancy, and also to Fargate and Lambda. EC2 Instance Savings Plans are tied to one instance family in one Region and do not cover Fargate or Lambda, and EC2 Reserved Instances (Standard or Convertible) cover only EC2 instances.',
  },
  {
    id: 'bill-006',
    domain: 'billing-support',
    question: 'Which statements about EC2 Instance Savings Plans are true? (Choose two.)',
    options: [
      'The commitment applies to a specific instance family in a chosen Region',
      'The discount automatically applies to AWS Fargate and AWS Lambda usage',
      'The customer commits to a consistent amount of usage in dollars per hour for a 1-year or 3-year term',
      'Unused commitments can be resold on the Reserved Instance Marketplace',
      'The plan reserves EC2 capacity in a specific Availability Zone',
    ],
    answer: [0, 2],
    explanation:
      'An **EC2 Instance Savings Plan** is a 1- or 3-year commitment to a dollar-per-hour spend on **one instance family in one Region**, with flexibility on size, OS and tenancy within that family. Fargate and Lambda are covered only by Compute Savings Plans, Savings Plans cannot be resold, and Savings Plans give a billing discount without reserving capacity.',
  },
  {
    id: 'bill-007',
    domain: 'billing-support',
    question:
      'A company wants to bring its existing per-socket and per-core server software licenses to AWS. It needs visibility into the physical sockets and cores of the server its instances run on. Which EC2 option should it use?',
    options: ['Dedicated Instances', 'Spot Instances', 'On-Demand Capacity Reservations', 'Dedicated Hosts'],
    answer: [3],
    explanation:
      '**Dedicated Hosts** are physical servers allocated to you, with visibility into sockets and cores, which supports bring-your-own-license (BYOL) models tied to physical hardware. Dedicated Instances run on single-tenant hardware but do not expose sockets and cores, Spot Instances are shared spare capacity, and Capacity Reservations only reserve capacity.',
  },
  {
    id: 'bill-008',
    domain: 'billing-support',
    question: 'Which statement correctly describes Amazon EC2 Dedicated Instances?',
    options: [
      'They run on hardware dedicated to one customer but do not give visibility into physical sockets and cores',
      'They let the customer control which specific physical server instances are placed on across launches',
      'They share physical hardware with other AWS accounts but are isolated by the hypervisor',
      'They can be interrupted with short notice when AWS needs the capacity back',
    ],
    answer: [0],
    explanation:
      '**Dedicated Instances** run on hardware dedicated to a single customer, but AWS manages placement and you get no host-level visibility. Controlling placement on a specific server (host affinity) is a **Dedicated Hosts** feature, shared hardware describes default tenancy, and interruption describes Spot Instances.',
  },
  {
    id: 'bill-009',
    domain: 'billing-support',
    question:
      'A company is running a one-week sales event and must be sure EC2 capacity is available in a specific Availability Zone. It does not want a 1-year or 3-year commitment. Which option should it use?',
    options: [
      'Regional Reserved Instances',
      'On-Demand Capacity Reservations',
      'Compute Savings Plans',
      'Spot Instances',
    ],
    answer: [1],
    explanation:
      '**On-Demand Capacity Reservations** reserve capacity in a specific Availability Zone for any duration, with no long-term commitment; you pay On-Demand rates whether or not you use the capacity. Regional Reserved Instances and Savings Plans give billing discounts but do not reserve capacity and need a 1- or 3-year term, and Spot Instances can be interrupted.',
  },
  {
    id: 'bill-010',
    domain: 'billing-support',
    question:
      'A company is buying Reserved Instances with a 3-year term. Which payment option gives the largest discount compared with On-Demand pricing?',
    options: ['No Upfront', 'Partial Upfront', 'All Upfront', 'Monthly billing at On-Demand rates'],
    answer: [2],
    explanation:
      'With Reserved Instances, the more you pay up front, the larger the discount, so **All Upfront** gives the biggest saving. No Upfront and Partial Upfront still discount the price but less, and paying On-Demand rates gives no discount at all.',
  },
  {
    id: 'bill-011',
    domain: 'billing-support',
    question: 'Which statements about AWS data transfer pricing are generally true? (Choose two.)',
    options: [
      'Data transfer between AWS Regions is always free',
      'Data transferred into AWS from the internet is generally not charged',
      'Data transfer between Availability Zones is always free',
      'Data transferred out from AWS to the internet is generally charged',
      'Data transfer is charged only after the account leaves the Free Tier',
    ],
    answer: [1, 3],
    explanation:
      'AWS generally does **not charge for inbound** data transfer from the internet, but **does charge for outbound** data transfer to the internet. Data transfer between Regions is charged, data transfer between Availability Zones is usually charged too, and outbound data charges do not depend on Free Tier status.',
  },
  {
    id: 'bill-012',
    domain: 'billing-support',
    question:
      'A company must keep compliance records for many years. The data is almost never read, and a retrieval time of up to 12 hours is acceptable. Which Amazon S3 storage class has the lowest storage cost for this data?',
    options: [
      'S3 Standard',
      'S3 Standard-Infrequent Access',
      'S3 Intelligent-Tiering',
      'S3 Glacier Deep Archive',
    ],
    answer: [3],
    explanation:
      '**S3 Glacier Deep Archive** is the lowest-cost S3 storage class and is built for long-term archives that are rarely accessed and can wait hours for retrieval. S3 Standard and Standard-IA cost more to store, and Intelligent-Tiering is aimed at data with unknown or changing access patterns.',
  },
  {
    id: 'bill-013',
    domain: 'billing-support',
    question:
      'A company stores data in Amazon S3 but cannot predict how often each object will be accessed. It wants S3 to move objects between access tiers automatically to save money, without paying retrieval fees. Which storage class should it use?',
    options: [
      'S3 Intelligent-Tiering',
      'S3 One Zone-Infrequent Access',
      'S3 Glacier Flexible Retrieval',
      'S3 Standard',
    ],
    answer: [0],
    explanation:
      '**S3 Intelligent-Tiering** monitors access and moves objects between tiers automatically for a small per-object monitoring fee, with no retrieval fees. One Zone-IA and Glacier Flexible Retrieval charge for retrievals and do not move data automatically, and S3 Standard does not optimize cost for infrequently accessed data.',
  },
  {
    id: 'bill-014',
    domain: 'billing-support',
    question:
      'A company creates a 500 GB Amazon EBS volume but stores only 50 GB of data on it. How is the storage on this volume billed?',
    options: [
      'For the 50 GB of data actually stored',
      'For the full 500 GB provisioned, for as long as the volume exists',
      'Only for the hours that the attached EC2 instance is running',
      'Only when data on the volume is read or written',
    ],
    answer: [1],
    explanation:
      'Amazon EBS volumes are billed on the **provisioned size** for as long as the volume exists, whether or not it is full and whether or not the instance is running. Billing for the data actually stored is how Amazon S3 works, and EBS storage is not tied to instance running time or to I/O activity.',
  },
  {
    id: 'bill-015',
    domain: 'billing-support',
    question: 'Which type of AWS Free Tier offer does not expire and is available to all AWS customers?',
    options: ['12 Months Free', 'Short-term free trials', 'Always Free', 'Promotional credits'],
    answer: [2],
    explanation:
      '**Always Free** offers do not expire and are available to new and existing customers, within set usage limits. 12-month offers and short-term trials are time-limited, and promotional credits normally have an expiry date.',
  },
  {
    id: 'bill-016',
    domain: 'billing-support',
    question: 'Which are benefits of consolidated billing in AWS Organizations? (Choose two.)',
    options: [
      'Each member account receives its own Technical Account Manager',
      'Member accounts automatically receive the Business Support+ plan',
      'Combined usage across accounts can qualify for volume pricing tiers',
      'Data transfer between accounts in the organization is no longer charged',
      'The organization receives one bill for multiple AWS accounts',
    ],
    answer: [2, 4],
    explanation:
      'Consolidated billing gives **one bill** for all accounts and **combines usage** so the organization can reach volume pricing tiers sooner; it also lets accounts share Reserved Instance and Savings Plans discounts. It does not grant a TAM or a support plan to member accounts, and normal data transfer charges still apply.',
  },
  {
    id: 'bill-017',
    domain: 'billing-support',
    question:
      'A finance team wants to view graphs of the last several months of AWS spending broken down by service and see a forecast of future costs. Which AWS service should it use?',
    options: [
      'AWS Pricing Calculator',
      'AWS Budgets',
      'AWS Cost and Usage Report',
      'AWS Cost Explorer',
    ],
    answer: [3],
    explanation:
      '**AWS Cost Explorer** lets you visualize, filter and analyze historical costs and usage, and forecast future costs. Pricing Calculator estimates costs for planned architectures, Budgets is for setting thresholds and alerts, and the Cost and Usage Report is a raw detailed data file rather than an interactive graphing tool.',
  },
  {
    id: 'bill-018',
    domain: 'billing-support',
    question:
      'A company wants to receive an email notification when its forecasted monthly AWS spend is expected to exceed a set amount. Which AWS service should it use?',
    options: ['AWS Budgets', 'AWS Cost Explorer', 'AWS Pricing Calculator', 'AWS Compute Optimizer'],
    answer: [0],
    explanation:
      '**AWS Budgets** lets you set custom cost or usage budgets and sends alerts when actual or **forecasted** amounts go over a threshold. Cost Explorer is for analysis and does not send threshold alerts, Pricing Calculator estimates costs before you build, and Compute Optimizer gives rightsizing recommendations.',
  },
  {
    id: 'bill-019',
    domain: 'billing-support',
    question:
      'A company is planning to migrate an on-premises application to AWS and wants to estimate the monthly cost of the proposed architecture before it creates any resources. Which tool should it use?',
    options: ['AWS Cost Explorer', 'AWS Pricing Calculator', 'AWS Budgets', 'AWS Billing Conductor'],
    answer: [1],
    explanation:
      '**AWS Pricing Calculator** estimates the cost of AWS services for a planned architecture, without needing an existing deployment. Cost Explorer and Budgets work with actual usage on an existing account, and Billing Conductor customizes how billing data is shown to groups of accounts.',
  },
  {
    id: 'bill-020',
    domain: 'billing-support',
    question:
      'A company needs the most detailed line-item billing data for all its accounts, delivered to an Amazon S3 bucket so analysts can query it with Amazon Athena. Which option should it use?',
    options: [
      'AWS Cost Explorer',
      'AWS Budgets',
      'AWS Cost and Usage Report',
      'AWS Trusted Advisor',
    ],
    answer: [2],
    explanation:
      'The **AWS Cost and Usage Report** (now set up through **Data Exports**) delivers the most granular cost and usage data to an S3 bucket, where it can be queried with Athena or loaded into other tools. Cost Explorer shows summarized views in the console, Budgets sends alerts, and Trusted Advisor gives best-practice recommendations.',
  },
  {
    id: 'bill-021',
    domain: 'billing-support',
    question: 'Which capabilities does AWS Budgets provide? (Choose two.)',
    options: [
      'Notifications when actual or forecasted costs exceed a threshold',
      'Automatic purchase of Reserved Instances to stay within budget',
      'Cost estimates for architectures that have not been deployed yet',
      'Budget actions, such as applying an IAM policy or SCP when a threshold is reached',
      'Rightsizing recommendations based on resource utilization metrics',
    ],
    answer: [0, 3],
    explanation:
      '**AWS Budgets** sends alerts on actual or forecasted cost and usage, and **budget actions** can respond automatically, for example by applying an IAM policy or service control policy. Budgets never buys Reserved Instances for you, pre-deployment estimates come from AWS Pricing Calculator, and rightsizing recommendations come from tools such as AWS Compute Optimizer.',
  },
  {
    id: 'bill-022',
    domain: 'billing-support',
    question:
      'A company wants to be alerted automatically about unusual spikes in its AWS spending without defining fixed thresholds for each service. Which AWS service uses machine learning to do this?',
    options: ['AWS Budgets', 'AWS Trusted Advisor', 'Amazon GuardDuty', 'AWS Cost Anomaly Detection'],
    answer: [3],
    explanation:
      '**AWS Cost Anomaly Detection** uses machine learning to learn normal spending patterns and alert you to unusual cost spikes. AWS Budgets relies on thresholds that you set, Trusted Advisor checks resources against best practices, and GuardDuty detects security threats, not cost anomalies.',
  },
  {
    id: 'bill-023',
    domain: 'billing-support',
    question:
      'A company has added a "Department" tag to all its AWS resources. What must it do next so that it can break down its costs by department in AWS Cost Explorer?',
    options: [
      'Activate the tag as a cost allocation tag in the Billing and Cost Management console',
      'Turn on AWS CloudTrail in every Region',
      'Upgrade to the Business Support+ plan',
      'Create a separate VPC for each department',
    ],
    answer: [0],
    explanation:
      'User-defined tags must be **activated as cost allocation tags** in the Billing and Cost Management console before they can be used to filter and group costs. CloudTrail records API activity, not costs, cost allocation tags do not need a paid support plan, and VPCs have nothing to do with cost reporting.',
  },
  {
    id: 'bill-024',
    domain: 'billing-support',
    question:
      'An AWS reseller needs to group its customers\' accounts and show each group billing data based on its own custom pricing rates, for showback and chargeback. Which AWS service is designed for this?',
    options: [
      'AWS Cost Explorer',
      'AWS Billing Conductor',
      'AWS Pricing Calculator',
      'AWS Cost Anomaly Detection',
    ],
    answer: [1],
    explanation:
      '**AWS Billing Conductor** lets you group accounts and apply custom pricing rules to create alternative billing data for showback and chargeback, which is common for resellers and large enterprises. Cost Explorer shows actual AWS costs, Pricing Calculator estimates future costs, and Cost Anomaly Detection flags unusual spend.',
  },
  {
    id: 'bill-025',
    domain: 'billing-support',
    question:
      'A company suspects many of its EC2 instances are larger than they need to be. Which AWS service analyzes utilization metrics with machine learning and recommends better-sized instance types?',
    options: ['AWS Pricing Calculator', 'AWS Budgets', 'AWS Compute Optimizer', 'Amazon Inspector'],
    answer: [2],
    explanation:
      '**AWS Compute Optimizer** analyzes historical utilization and recommends optimal resources, such as smaller EC2 instance types, to reduce cost. Pricing Calculator only estimates prices, Budgets tracks spend against thresholds, and Amazon Inspector scans for software vulnerabilities.',
  },
  {
    id: 'bill-026',
    domain: 'billing-support',
    question: 'Which of the following are AWS Trusted Advisor cost optimization checks? (Choose two.)',
    options: [
      'Amazon S3 bucket permissions',
      'Low utilization Amazon EC2 instances',
      'MFA on the root account',
      'Service quotas nearing their limits',
      'Unassociated Elastic IP addresses',
    ],
    answer: [1, 4],
    explanation:
      '**Low utilization EC2 instances** and **unassociated Elastic IP addresses** are cost optimization checks because they point to resources you pay for but are not using well. S3 bucket permissions and root account MFA are security checks, and service quotas belong to the service limits category.',
  },
  {
    id: 'bill-027',
    domain: 'billing-support',
    question:
      'A company wants access to the full set of AWS Trusted Advisor checks at the lowest cost. Which AWS Support plan should it choose?',
    options: ['Basic', 'Enterprise Support', 'Unified Operations', 'Business Support+'],
    answer: [3],
    explanation:
      'The full set of Trusted Advisor checks needs a **paid** support plan, and **Business Support+** is the lowest-cost paid plan. Basic includes only a core set of checks, and Enterprise Support and Unified Operations include the full set at a higher cost. In December 2025 AWS replaced the Developer, Business and Enterprise On-Ramp plans; older study material and exam questions may still use those names.',
  },
  {
    id: 'bill-028',
    domain: 'billing-support',
    question:
      'A large company wants a designated Technical Account Manager (TAM) who knows its environment and works with it proactively, at the lowest cost. Which AWS Support plan should it choose?',
    options: ['Enterprise Support', 'Business Support+', 'Basic', 'Unified Operations'],
    answer: [0],
    explanation:
      '**Enterprise Support** is the lowest-cost plan with a **designated** TAM. Unified Operations also includes one but sits above Enterprise at a higher cost, and Business Support+ and Basic do not include a TAM. The retired Enterprise On-Ramp plan offered a *pool* of TAMs rather than a designated one.',
  },
  {
    id: 'bill-029',
    domain: 'billing-support',
    question:
      'A study guide written before December 2025 recommends Developer Support for a team that needs to open technical support cases at the lowest cost. Which plan should a new customer choose today?',
    options: ['Business Support+', 'Developer Support', 'Enterprise On-Ramp', 'Basic'],
    answer: [0],
    explanation:
      'Developer Support and Business Support stopped accepting new subscriptions in December 2025, and **Business Support+** is now the lowest-cost plan with technical support cases. Enterprise On-Ramp is also being retired, and Basic does not include technical support cases.',
  },
  {
    id: 'bill-030',
    domain: 'billing-support',
    question:
      'Which AWS Support plan includes customer service for account and billing questions, documentation and AWS re:Post, but does not allow technical support cases to be opened?',
    options: ['Business Support+', 'Enterprise Support', 'Basic', 'Unified Operations'],
    answer: [2],
    explanation:
      '**Basic Support** is included for all AWS customers and covers account and billing help, documentation, re:Post, the AWS Health Dashboard and core Trusted Advisor checks, but not technical support cases. Business Support+, Enterprise Support and Unified Operations all include technical support.',
  },
  {
    id: 'bill-031',
    domain: 'billing-support',
    question: 'Which of the following are included with the AWS Basic Support plan? (Choose two.)',
    options: [
      'AWS Health Dashboard',
      'Technical support cases with Cloud Support Engineers',
      'A core set of AWS Trusted Advisor checks',
      'A Technical Account Manager',
      'Programmatic access through the AWS Support API',
    ],
    answer: [0, 2],
    explanation:
      'All customers, including those on **Basic Support**, get the **AWS Health Dashboard** and a **core set of Trusted Advisor checks**. Technical support cases need a paid plan (Business Support+ or higher), a TAM comes only with Enterprise Support and Unified Operations, and the AWS Support API needs a paid plan.',
  },
  {
    id: 'bill-032',
    domain: 'billing-support',
    question: 'Which AWS Support plans include a designated Technical Account Manager (TAM)? (Choose two.)',
    options: ['Basic', 'Business Support+', 'Enterprise Support', 'Unified Operations', 'AWS re:Post'],
    answer: [2, 3],
    explanation:
      '**Enterprise Support** and **Unified Operations** both include a designated TAM; Unified Operations is the higher tier. Basic and Business Support+ do not include a TAM, and AWS re:Post is a community Q&A site, not a support plan. In December 2025 AWS replaced the Developer, Business and Enterprise On-Ramp plans; older study material and exam questions may still use those names.',
  },
  {
    id: 'bill-033',
    domain: 'billing-support',
    question:
      'A company runs production workloads on AWS and needs 24/7 access to AWS Support by phone, web and chat, at the lowest cost. It does not need a Technical Account Manager. Which AWS Support plan should it choose?',
    options: ['Business Support+', 'Basic', 'Enterprise Support', 'Unified Operations'],
    answer: [0],
    explanation:
      '**Business Support+** is the lowest-cost plan with 24/7 phone, web and chat access to AWS Support. Basic has no technical support, and Enterprise Support and Unified Operations add a designated TAM at a much higher cost. In December 2025 AWS replaced the Developer, Business and Enterprise On-Ramp plans; older study material and exam questions may still use those names.',
  },
  {
    id: 'bill-034',
    domain: 'billing-support',
    question:
      'A company wants to read AWS Health events programmatically through the AWS Health API instead of only viewing them in the console. What does it need?',
    options: [
      'A paid AWS Support plan, such as Business Support+',
      'Nothing extra; the AWS Health API is free for every account',
      'An AWS Organizations management account',
      'A subscription in AWS Marketplace',
    ],
    answer: [0],
    explanation:
      'The **AWS Health Dashboard** is free for everyone, but programmatic access through the **AWS Health API** requires a **paid support plan**. AWS Organizations can aggregate Health events across accounts, but it does not replace the support plan requirement, and Marketplace is unrelated.',
  },
  {
    id: 'bill-035',
    domain: 'billing-support',
    question:
      'An organization already has Enterprise Support and wants the highest level of AWS Support available. Which plan sits above Enterprise Support?',
    options: ['Business Support+', 'Unified Operations', 'Enterprise On-Ramp', 'Basic'],
    answer: [1],
    explanation:
      '**Unified Operations** is the top AWS Support plan, above Enterprise Support. Business Support+ and Basic are lower tiers, and Enterprise On-Ramp was a lower tier than Enterprise that AWS is retiring.',
  },
  {
    id: 'bill-036',
    domain: 'billing-support',
    question: 'Which of the following require a paid AWS Support plan rather than Basic Support? (Choose two.)',
    options: [
      'The AWS Health Dashboard',
      'The full set of AWS Trusted Advisor checks',
      'AWS documentation and AWS re:Post',
      'Programmatic access through the AWS Support API',
      'Customer service for account and billing questions',
    ],
    answer: [1, 3],
    explanation:
      'The **full set of Trusted Advisor checks** and the **AWS Support API** need a paid plan such as Business Support+. The Health Dashboard, documentation, re:Post and account and billing customer service are available to every customer on Basic.',
  },
  {
    id: 'bill-037',
    domain: 'billing-support',
    question:
      'A developer wants to post a technical question and get answers from a community of AWS users, AWS experts and AWS employees. Which AWS resource should the developer use?',
    options: [
      'AWS Knowledge Center',
      'AWS Prescriptive Guidance',
      'AWS Marketplace',
      'AWS re:Post',
    ],
    answer: [3],
    explanation:
      '**AWS re:Post** is the community question-and-answer service where anyone can ask questions and get answers from the community and AWS experts. Knowledge Center offers articles that AWS writes in answer to common support questions, Prescriptive Guidance offers strategies and patterns, and Marketplace sells software.',
  },
  {
    id: 'bill-038',
    domain: 'billing-support',
    question:
      'Which AWS resource provides articles and videos that answer the questions and requests AWS Support receives most often?',
    options: [
      'AWS Knowledge Center',
      'AWS Prescriptive Guidance',
      'AWS Health Dashboard',
      'AWS Partner Network',
    ],
    answer: [0],
    explanation:
      'The **AWS Knowledge Center** (part of AWS re:Post) contains articles and videos covering the most frequent questions and requests from AWS customers. Prescriptive Guidance focuses on strategies, guides and patterns, the Health Dashboard reports AWS events, and the Partner Network is a program for AWS Partners.',
  },
  {
    id: 'bill-039',
    domain: 'billing-support',
    question:
      'A company is planning a large migration and wants time-tested strategies, guides and patterns created by AWS experts and AWS Partners. Which AWS resource should it use?',
    options: [
      'AWS Knowledge Center',
      'AWS Prescriptive Guidance',
      'AWS Trusted Advisor',
      'AWS Marketplace',
    ],
    answer: [1],
    explanation:
      '**AWS Prescriptive Guidance** provides strategies, guides and patterns from AWS and AWS Partners to help speed up migration, modernization and optimization projects. Knowledge Center answers common support questions, Trusted Advisor checks your account against best practices, and Marketplace is a software catalog.',
  },
  {
    id: 'bill-040',
    domain: 'billing-support',
    question:
      'A company wants to hire a global team of experts employed by AWS to help it achieve specific business outcomes during a large cloud migration project. Which AWS offering should it use?',
    options: [
      'AWS Managed Services',
      'AWS Marketplace',
      'AWS Professional Services',
      'AWS Trust & Safety team',
    ],
    answer: [2],
    explanation:
      '**AWS Professional Services** is a global team of AWS experts that works with customers, often alongside AWS Partners, to deliver projects such as migrations. AWS Managed Services operates infrastructure on an ongoing basis, Marketplace sells third-party software, and Trust & Safety handles abuse reports.',
  },
  {
    id: 'bill-041',
    domain: 'billing-support',
    question: 'Which statements correctly describe the AWS Partner Network (APN)? (Choose two.)',
    options: [
      'APN Partners are AWS employees assigned to Enterprise Support customers',
      'Consulting (services) Partners help customers design, migrate, build and manage workloads on AWS',
      'Technology (software) Partners provide software, hardware or connectivity solutions that run on or integrate with AWS',
      'Customers must join the APN before they can buy from AWS Marketplace',
      'APN Partners investigate reports of abuse involving AWS resources',
    ],
    answer: [1, 2],
    explanation:
      'The APN is a global community of companies: **Consulting (services) Partners** deliver professional and managed services, and **Technology (software) Partners** build products that run on or integrate with AWS. Partners are not AWS employees, customers do not need to join the APN to use Marketplace, and abuse reports go to the AWS Trust & Safety team.',
  },
  {
    id: 'bill-042',
    domain: 'billing-support',
    question:
      'A company wants to find, buy and deploy third-party software, such as security appliances and SaaS products, and have the charges appear on its AWS bill. Which AWS offering should it use?',
    options: [
      'AWS Partner Network',
      'AWS Professional Services',
      'AWS Service Catalog',
      'AWS Marketplace',
    ],
    answer: [3],
    explanation:
      '**AWS Marketplace** is a curated digital catalog of third-party software, data and services that can be bought and billed through your AWS account. The Partner Network is a program for partner companies, Professional Services is AWS consulting, and Service Catalog lets an organization manage its own approved catalog of IT products.',
  },
  {
    id: 'bill-043',
    domain: 'billing-support',
    question:
      'A company notices that an IP address belonging to AWS is sending spam and port scans to its servers. Whom should it contact to report this?',
    options: [
      'The AWS Trust & Safety team',
      'The AWS Support Concierge team',
      'AWS Professional Services',
      'Its Technical Account Manager',
    ],
    answer: [0],
    explanation:
      'Suspected abuse from AWS resources, such as spam, port scanning, DoS attacks or malware, should be reported to the **AWS Trust & Safety team**. Concierge handles billing and account questions, Professional Services delivers projects, and a TAM is an Enterprise-tier advisor, not the abuse reporting channel.',
  },
  {
    id: 'bill-044',
    domain: 'billing-support',
    question:
      'A company wants AWS to operate its AWS infrastructure on an ongoing basis, including patching, backup, monitoring and incident management, so its staff can focus on applications. Which AWS offering meets this need?',
    options: [
      'AWS Professional Services',
      'AWS Managed Services',
      'AWS Support Concierge',
      'AWS Systems Manager',
    ],
    answer: [1],
    explanation:
      '**AWS Managed Services (AMS)** operates AWS infrastructure on your behalf, handling tasks such as patching, backup, monitoring and incident response. Professional Services focuses on project engagements rather than ongoing operations, Concierge covers billing and account questions, and Systems Manager is a tool you operate yourself.',
  },
  {
    id: 'bill-045',
    domain: 'billing-support',
    question:
      'In an AWS Organizations organization with consolidated billing, Account A buys EC2 Reserved Instances it is not fully using. Account B runs matching EC2 instances. Discount sharing has not been turned off. What happens?',
    options: [
      'Account B pays On-Demand rates because Reserved Instances apply only to the account that bought them',
      'The unused Reserved Instances are automatically converted into Savings Plans',
      "The Reserved Instance discount can apply to Account B's matching usage",
      'Account A receives a refund for the unused Reserved Instance hours',
    ],
    answer: [2],
    explanation:
      'With consolidated billing, Reserved Instance and Savings Plans **discounts are shared** across accounts in the organization by default, so unused RI hours from Account A can apply to matching usage in Account B. RIs are not limited to the buying account when sharing is on, they are never converted to Savings Plans, and unused hours are not refunded.',
  },
  {
    id: 'bill-046',
    domain: 'billing-support',
    question: 'Which AWS pricing models require a 1-year or 3-year commitment? (Choose two.)',
    options: [
      'Reserved Instances',
      'Spot Instances',
      'On-Demand Capacity Reservations',
      'On-Demand Instances',
      'Savings Plans',
    ],
    answer: [0, 4],
    explanation:
      '**Reserved Instances** and **Savings Plans** give discounts in exchange for a 1-year or 3-year commitment. Spot Instances and On-Demand Instances need no commitment, and On-Demand Capacity Reservations can be created and cancelled without a 1- or 3-year term.',
  },
  {
    id: 'bill-047',
    domain: 'billing-support',
    question: 'What happens to an EC2 Spot Instance when AWS needs the capacity back?',
    options: [
      'It keeps running and is billed at the On-Demand rate',
      'The customer is asked to raise its bid within 24 hours',
      'It is automatically moved to a Dedicated Host',
      'It can be interrupted after a two-minute warning',
    ],
    answer: [3],
    explanation:
      'AWS can **interrupt** a Spot Instance when it needs the capacity, after giving a **two-minute interruption notice**. Spot Instances are not switched to On-Demand billing, there is no bidding window, and they are not moved to Dedicated Hosts.',
  },
  {
    id: 'bill-048',
    domain: 'billing-support',
    question:
      'Which AWS pricing model offers lower prices in exchange for a commitment to a consistent amount of compute usage, measured in dollars per hour, over a 1-year or 3-year term?',
    options: ['Savings Plans', 'Spot Instances', 'On-Demand Instances', 'Dedicated Instances'],
    answer: [0],
    explanation:
      '**Savings Plans** are defined by a commitment to a consistent spend in **dollars per hour** for 1 or 3 years. Spot Instances use spare capacity with no commitment, On-Demand has no commitment or discount, and Dedicated Instances are a tenancy option rather than a discount model.',
  },
  {
    id: 'bill-049',
    domain: 'billing-support',
    question:
      'A company wants a billing discount on EC2 and also wants capacity reserved in a specific Availability Zone. Which purchase option provides both?',
    options: [
      'Regional Reserved Instance',
      'Zonal Reserved Instance',
      'Compute Savings Plan',
      'EC2 Instance Savings Plan',
    ],
    answer: [1],
    explanation:
      'A **zonal Reserved Instance** is scoped to one Availability Zone and gives both a discount and a **capacity reservation** there. Regional Reserved Instances and both types of Savings Plans give a billing discount only, without reserving capacity.',
  },
  {
    id: 'bill-050',
    domain: 'billing-support',
    question: 'Which type of network traffic generally has no data transfer charge?',
    options: [
      'Traffic from an EC2 instance to users on the internet',
      'Traffic between EC2 instances in different AWS Regions',
      'Traffic between EC2 instances in the same Availability Zone using private IP addresses',
      'Traffic between EC2 instances in different Availability Zones',
    ],
    answer: [2],
    explanation:
      'Data transfer between EC2 instances in the **same Availability Zone over private IP addresses** is free. Outbound traffic to the internet is charged, traffic between Regions is charged, and traffic between Availability Zones is charged in each direction.',
  },
  {
    id: 'bill-051',
    domain: 'billing-support',
    question: 'Which tasks can a company perform with AWS Cost Explorer? (Choose two.)',
    options: [
      'Estimate costs for AWS services the company has never used',
      'Receive detailed line-item billing files in Amazon S3 for querying with Athena',
      'View and filter historical cost and usage data',
      'Forecast future costs based on past usage',
      'Apply custom pricing rates to show billing data to business units',
    ],
    answer: [2, 3],
    explanation:
      '**AWS Cost Explorer** lets you **view and filter historical** cost and usage and **forecast** future spend. Estimating new services is the job of AWS Pricing Calculator, line-item files in S3 come from the Cost and Usage Report (Data Exports), and custom pricing rates are a feature of AWS Billing Conductor.',
  },
  {
    id: 'bill-052',
    domain: 'billing-support',
    question:
      'With consolidated billing in AWS Organizations, which account is responsible for paying the charges of all member accounts?',
    options: [
      'Each member account pays its own charges separately',
      'A delegated administrator account',
      'The member account with the highest usage',
      'The management account',
    ],
    answer: [3],
    explanation:
      'With consolidated billing, the **management account** pays all the charges of the member accounts on a single bill. Member accounts do not pay separately, a delegated administrator manages specific AWS services rather than billing, and payment is not assigned by usage.',
  },
  {
    id: 'bill-053',
    domain: 'billing-support',
    question:
      'An accountant needs to update the payment method, view invoices and download past AWS bills. Where should the accountant do this?',
    options: [
      'AWS Billing and Cost Management console',
      'AWS Cost Explorer',
      'AWS Trusted Advisor',
      'AWS Pricing Calculator',
    ],
    answer: [0],
    explanation:
      'The **AWS Billing and Cost Management console** is where you manage payment methods, view and download bills and invoices, and reach tools such as Budgets and Cost Explorer. Cost Explorer analyzes spend but does not manage payments, Trusted Advisor gives recommendations, and Pricing Calculator produces estimates.',
  },
  {
    id: 'bill-054',
    domain: 'billing-support',
    question:
      'For some AWS services, such as Amazon S3 storage, the price per GB goes down as monthly usage grows. Which pricing concept does this describe?',
    options: [
      'A flat price per unit at every level of usage',
      'Paying less per unit as usage increases',
      'Paying more per unit as usage increases',
      'A fixed monthly fee regardless of usage',
    ],
    answer: [1],
    explanation:
      'AWS uses **tiered (volume-based) pricing** for some services, so you **pay less per unit as usage increases**. This is also why combining usage through consolidated billing can lower costs. The other options do not describe how tiered pricing works.',
  },
  {
    id: 'bill-055',
    domain: 'billing-support',
    question:
      'A company wants to create and manage support cases programmatically through the AWS Support API. Which is the lowest-cost AWS Support plan that allows this?',
    options: ['Basic', 'Enterprise Support', 'Business Support+', 'Unified Operations'],
    answer: [2],
    explanation:
      'The **AWS Support API** needs a paid plan, and **Business Support+** is the lowest-cost one. Basic does not include Support API access, and Enterprise Support and Unified Operations include it at a higher cost. In December 2025 AWS replaced the Developer, Business and Enterprise On-Ramp plans; older study material and exam questions may still use those names.',
  },
  {
    id: 'bill-056',
    domain: 'billing-support',
    question:
      'Which AWS services can recommend ways to reduce costs for EC2 instances that are already running and underused? (Choose two.)',
    options: [
      'AWS Pricing Calculator',
      'AWS Compute Optimizer',
      'AWS Billing Conductor',
      'AWS Trusted Advisor',
      'AWS Artifact',
    ],
    answer: [1, 3],
    explanation:
      '**AWS Compute Optimizer** gives rightsizing recommendations from utilization data, and **AWS Trusted Advisor** flags low utilization EC2 instances in its cost optimization checks. Pricing Calculator estimates planned costs, Billing Conductor customizes billing data, and AWS Artifact gives access to compliance reports.',
  },
  {
    id: 'bill-057',
    domain: 'billing-support',
    question:
      'A compliance rule says a company\'s EC2 instances must run on hardware that is not shared with other AWS customers. The company does not need visibility into sockets or cores and wants the least management effort. Which option should it use?',
    options: [
      'Spot Instances',
      'Dedicated Hosts',
      'On-Demand Instances with default tenancy',
      'Dedicated Instances',
    ],
    answer: [3],
    explanation:
      '**Dedicated Instances** run on hardware dedicated to one customer while AWS handles placement, so there are no hosts to manage. Dedicated Hosts also meet the rule but add host management and are mainly needed for socket- or core-based licensing, while Spot and default-tenancy instances may share hardware with other customers.',
  },
  {
    id: 'bill-058',
    domain: 'billing-support',
    question:
      'Which AWS resource, available with every AWS Support plan, shows events and scheduled changes in AWS services that affect the specific resources in a customer\'s account?',
    options: [
      'AWS Health Dashboard',
      'AWS Trusted Advisor',
      'AWS Cost Anomaly Detection',
      'Amazon CloudWatch',
    ],
    answer: [0],
    explanation:
      'The **AWS Health Dashboard** shows the status of AWS services and personalized information about events, such as scheduled maintenance, that affect your own resources, and it is available to all customers. Trusted Advisor checks best practices, Cost Anomaly Detection watches spend, and CloudWatch monitors metrics and logs that you define.',
  },
  {
    id: 'bill-059',
    domain: 'billing-support',
    question: 'How is AWS Lambda usage billed?',
    options: [
      'By each hour that a function is deployed',
      'By the number of requests and the duration of code execution',
      'By a fixed monthly fee for each function',
      'By the number of lines of code in each function',
    ],
    answer: [1],
    explanation:
      'AWS Lambda charges for the **number of requests** and the **duration** your code runs, which depends on the memory you allocate. You pay nothing while a function sits idle, there is no fixed monthly fee per function, and code size does not affect compute charges.',
  },
  {
    id: 'bill-060',
    domain: 'billing-support',
    question:
      'Which resources are available to all AWS customers at no extra cost, regardless of their AWS Support plan? (Choose two.)',
    options: [
      'AWS documentation',
      'AWS re:Post',
      'A designated Technical Account Manager',
      'An AWS Professional Services engagement',
      'The AWS Support Concierge team',
    ],
    answer: [0, 1],
    explanation:
      '**AWS documentation** and **AWS re:Post** are free for every customer, including those on Basic Support. A designated TAM comes only with Enterprise, Concierge only with the Enterprise tiers, and Professional Services engagements are paid separately.',
  },
];
