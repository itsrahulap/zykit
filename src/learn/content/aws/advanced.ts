import type { Topic } from "../../types/content";
import { md } from "./md";

export const awsAdvancedTopics: Topic[] = [
  {
    id: "security-services",
    title: "AWS Security Services",
    level: "advanced",
    description: "Organizations and SCPs, Artifact, Shield, WAF, KMS, Inspector, GuardDuty, Security Hub and Macie.",
    explanation: md(
      "Beyond IAM and network rules, AWS offers a toolbox of security services. Group them by the job they do.",
      "**Governance and compliance**",
      "- **AWS Organizations**: manage many accounts centrally with **organizational units (OUs)**, consolidated billing, and **service control policies (SCPs)**. SCPs set the *maximum* permissions accounts can have - they never grant access by themselves.\n- **AWS Artifact**: self-service portal for AWS compliance reports and agreements.\n- **AWS Config / CloudTrail**: configuration compliance and audit trail (see monitoring).",
      "**Protecting against attacks**",
      "- **AWS Shield**: DDoS protection. *Standard* is automatic and free for all customers; *Advanced* adds enhanced detection, response support, and cost protection for protected resources.\n- **AWS WAF**: web application firewall that filters HTTP requests by rules (SQL injection, bad bots, rate limits) on CloudFront, ALB, API Gateway and more.",
      "**Protecting data**",
      "- **AWS KMS** (Key Management Service): create and control encryption keys. **Encryption at rest** protects stored data (S3, EBS, RDS); **encryption in transit** protects data moving over the network with TLS. Related: Secrets Manager and Parameter Store for secrets, CloudHSM for dedicated hardware modules.\n- **Amazon Macie**: uses machine learning to discover sensitive data (like personal information) in S3.",
      "**Detecting threats and weaknesses**",
      "- **Amazon Inspector**: scans workloads such as EC2, containers and Lambda for software vulnerabilities and unintended exposure.\n- **Amazon GuardDuty**: threat detection that analyses logs and network activity for suspicious behavior.\n- **AWS Security Hub**: aggregates and prioritises findings from GuardDuty, Inspector, Macie and others in one place and checks against standards.\n- **Amazon Detective** helps investigate the root cause of findings.",
      "**More security services**",
      "- **AWS Secrets Manager**: stores and automatically rotates secrets such as database passwords and API keys.\n- **AWS Certificate Manager (ACM)**: provisions, manages and renews public and private TLS certificates for services like CloudFront and load balancers.\n- **AWS CloudHSM**: single-tenant hardware security modules you control, for strict key-control requirements.\n- **Amazon Cognito**: sign-up, sign-in and access control for your web and mobile app users (customer identity), as opposed to IAM for your workforce.\n- **AWS Directory Service**: managed Microsoft Active Directory in AWS, plus AD Connector and Simple AD options.\n- **AWS Network Firewall**: managed stateful firewall and intrusion prevention for VPCs.\n- **AWS Firewall Manager**: centrally configures WAF, Shield Advanced, Network Firewall and security groups across accounts in Organizations.\n- **AWS Resource Access Manager (RAM)**: shares resources such as subnets or Transit Gateways with other accounts without copying them.\n- **Amazon Detective** builds a graph of related logs to find the root cause of a finding; **AWS Security Hub** collects findings; **Amazon Macie** finds sensitive data in S3; **Amazon Inspector** scans for vulnerabilities.",
      "**Security resources**: AWS Trusted Advisor security checks, the AWS Knowledge Center, security blogs, whitepapers and AWS Marketplace security products, plus the Artifact portal for compliance reports.",
    ),
    analogy:
      "Securing an account is like running a museum. Organizations and SCPs are the museum-wide rules no gallery manager can override. Shield and WAF are the barriers and bag checks at the entrance. KMS is the locksmith who keeps the keys to the vitrines. Inspector checks the locks and windows for weaknesses, GuardDuty is the camera system spotting odd behavior, Macie finds valuables left unlabeled on tables, and Security Hub is the control room with one screen of all alerts.",
    examples: [
      {
        title: "A service control policy (guardrail)",
        language: "json",
        code: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyOutsideApprovedRegions",
      "Effect": "Deny",
      "NotAction": ["iam:*", "organizations:*", "route53:*", "cloudfront:*", "support:*"],
      "Resource": "*",
      "Condition": {
        "StringNotEquals": { "aws:RequestedRegion": ["eu-west-1", "eu-central-1"] }
      }
    },
    {
      "Sid": "ProtectCloudTrail",
      "Effect": "Deny",
      "Action": ["cloudtrail:StopLogging", "cloudtrail:DeleteTrail"],
      "Resource": "*"
    }
  ]
}`,
        explanation: "Attached to an OU, this restricts every account in it to two Regions and prevents anyone, even admins, from switching off auditing.",
      },
      {
        title: "Encrypt with KMS",
        language: "bash",
        code: `KEY=$(aws kms create-key --description "app data key" --query KeyMetadata.KeyId --output text)
aws kms create-alias --alias-name alias/app-data --target-key-id "$KEY"

aws s3api put-bucket-encryption --bucket zykit-demo-bucket-12345 \\
  --server-side-encryption-configuration '{
    "Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"aws:kms","KMSMasterKeyID":"alias/app-data"}}]
  }'`,
      },
      {
        title: "Which service?",
        language: "text",
        code: `Question                                              Service
----------------------------------------------------  ----------------
Where do I download AWS's SOC / ISO reports?          Artifact
Stop a Region or service across 50 accounts?          Organizations SCP
Block SQL injection on my website?                    WAF
Absorb a volumetric DDoS attack?                      Shield
Manage encryption keys?                               KMS
Find personal data stored in S3?                      Macie
Scan EC2 / images for known vulnerabilities?          Inspector
Detect odd API calls or crypto-mining traffic?        GuardDuty
See all findings in one dashboard?                    Security Hub`,
      },
    ],
    howItWorks: md(
      "**SCP evaluation**: an action is allowed only if the account's IAM permissions allow it *and* no SCP in the path from the organization root to the account blocks it. **Envelope encryption** in KMS: a KMS key encrypts a small data key, and the data key encrypts your data; services do this for you.",
      "Detection services run continuously: GuardDuty reads CloudTrail, VPC flow logs and DNS logs; Inspector scans on events like new images; Macie samples S3 contents. Findings flow to Security Hub for triage and can trigger automated response through EventBridge and Lambda.",
    ),
    diagram: `   Organization root
      |-- OU: Prod  ----- SCPs (max permissions)
      |      '-- accounts
      '-- OU: Dev
  Edge:   Shield + WAF  -->  CloudFront / ALB
  Data:   KMS keys  -->  S3 / EBS / RDS encryption
  Detect: GuardDuty + Inspector + Macie --> Security Hub --> alerts`,
    whyItExists: md(
      "Attackers, mistakes and compliance requirements grow with scale. Central guardrails and automated detection let small teams protect many accounts consistently instead of relying on every engineer remembering everything.",
    ),
    whenToUse: md(
      "Use Organizations from the start for multi-account structure, encrypt by default with KMS, put WAF and Shield in front of public apps, and enable GuardDuty, Inspector, and Security Hub as baseline detection.",
    ),
    whenNotToUse: md(
      "Do not use SCPs to grant permissions (they only restrict). Shield Advanced is overkill for low-risk internal apps. A WAF is not a substitute for fixing vulnerable code.",
    ),
    commonMistakes: [
      "Thinking an SCP gives users access.",
      "Encrypting data but leaving key policies wide open.",
      "Enabling detection services but never reading or routing findings.",
      "Confusing Inspector (vulnerabilities in workloads), GuardDuty (threat detection), and Macie (sensitive data).",
      "Assuming Shield Advanced is required to get basic DDoS protection.",
      "Mixing up Cognito (your app's customers) with IAM Identity Center (your workforce).",
      "Hard-coding database passwords instead of using Secrets Manager.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Match each to its job: Artifact, KMS, WAF, Macie, GuardDuty, Inspector." },
      { difficulty: "Medium", prompt: "Write an SCP that prevents leaving the organization and explain why attaching it at an OU is safer than at each account." },
      { difficulty: "Medium", prompt: "Explain encryption at rest vs in transit with one AWS example each." },
      { difficulty: "Hard", prompt: "GuardDuty reports an EC2 instance contacting a known malicious IP. Outline a response: isolate, investigate with logs, rotate credentials, remediate." },
    ],
    interviewQuestions: [
      { question: "What is an SCP?", answer: "A policy in AWS Organizations that sets the maximum available permissions for accounts in an OU or the organization; it does not grant permissions." },
      { question: "Shield Standard vs Advanced?", answer: "Standard is automatic and free for all customers against common network and transport layer attacks; Advanced offers extended protections, 24/7 response team access and cost protection for a fee." },
      { question: "What does KMS do?", answer: "Creates, stores and controls cryptographic keys used to encrypt data in AWS services and applications." },
      { question: "Exam-style: Which service finds sensitive data such as PII in S3?", answer: "Amazon Macie." },
      { question: "Exam-style: Where can a customer download AWS compliance reports?", answer: "AWS Artifact." },
      { question: "Exam-style: Which service rotates database credentials automatically?", answer: "AWS Secrets Manager." },
      { question: "Exam-style: Which service manages TLS certificates for a CloudFront distribution?", answer: "AWS Certificate Manager." },
      { question: "Exam-style: Which service enforces WAF rules across all accounts in an organization?", answer: "AWS Firewall Manager." },
    ],
    prerequisites: ["iam-basics", "network-security", "shared-responsibility-model"],
    relatedTopics: ["monitoring-and-auditing", "pricing-and-billing", "well-architected-framework", "block-file-object-storage"],
    keywords: ["organizations", "scp", "shield", "waf", "kms", "inspector", "guardduty", "security hub", "macie", "artifact", "encryption", "ddos", "secrets manager", "acm", "cloudhsm", "cognito", "detective", "firewall manager", "network firewall", "ram", "directory service", "active directory"],
  },

  {
    id: "pricing-and-billing",
    title: "Pricing, Billing and Support",
    level: "advanced",
    description: "How AWS charges, cost tools (Calculator, Budgets, Cost Explorer), consolidated billing, tags, support plans and Marketplace.",
    explanation: md(
      "AWS pricing follows a few principles: **pay for what you use**, **pay less when you reserve** (commitments), and **pay less as you use more** (volume tiers). Some services also have a **Free Tier**, in three flavors: *always free*, *12 months free* for new accounts, and *short-term trials*. Free offers change over time - read the current rules.",
      "**Cost tools**",
      "- **AWS Pricing Calculator**: estimate the cost of an architecture *before* you build it.\n- **Billing and Cost Management dashboard**: your current spend and bills.\n- **AWS Cost Explorer**: visualise and analyse past spend and usage, with forecasts.\n- **AWS Budgets**: set cost or usage thresholds with alerts (and actions) when you are forecast to exceed them.\n- **Cost allocation tags**: key-value labels (like `team=checkout`) that let you group costs.\n- **Cost and Usage Report**: the most detailed dataset of charges.",
      "**Consolidated billing** in AWS Organizations combines the charges of all member accounts into one bill, shares volume-discount tiers and commitment discounts, and keeps per-account detail.",
      "**Support plans**: **Basic** (included; documentation, forums, account and billing support, limited Trusted Advisor checks), **Developer** (business-hours technical support by email), **Business** (24/7 phone/chat/email, full Trusted Advisor checks, faster response), **Enterprise On-Ramp** (adds a pool of Technical Account Managers and a guided path), **Enterprise** (adds a designated **Technical Account Manager (TAM)**, the fastest response for critical issues, and proactive guidance). Verify features and response times on the current pricing page.",
      "**AWS Marketplace** is a catalog of third-party software you can buy and deploy, billed on your AWS invoice.",
      "**Data transfer costs**: data coming *into* AWS from the internet is generally free; data going *out* to the internet is charged per GB (with a small free monthly allowance); transfer between Regions is charged; transfer between AZs in a Region is charged at a lower rate; and traffic within the same AZ using private IPs is free. Putting resources in the same AZ or using CloudFront can lower transfer bills, but cross-AZ placement is still right for availability.",
      "**Billing tools in more detail**: **cost allocation tags** (user-defined and AWS-generated) must be activated in the Billing console before they show up in Cost Explorer and the **Cost and Usage Report (CUR)**, the most detailed billing data delivered to S3. **AWS Billing Conductor** lets you create custom billing groups and pro-forma rates, useful for resellers and chargeback or showback inside a company. **Consolidated billing** in Organizations combines usage for volume discounts, and **AWS Budgets** alerts or can trigger actions when cost or usage crosses a threshold.",
      "**Other pricing models**: pay as you go, save when you reserve (RIs, Savings Plans), pay less as you use more (tiered pricing, for example S3), and save through volume discounts. Some services have a Free Tier: always-free, 12-months-free for new accounts, and short trials.",
    ),
    analogy:
      "AWS billing resembles a utility bill with extra dashboards: Pricing Calculator is the quote you ask for before moving into a house, Cost Explorer is the monthly usage chart, Budgets is the alarm that rings when you are on track to overspend, tags are the room labels that show which room used the most electricity, and a support plan is the level of repair-service contract you bought.",
    examples: [
      {
        title: "A budget with an alert",
        language: "json",
        code: `{
  "BudgetName": "monthly-cap",
  "BudgetType": "COST",
  "TimeUnit": "MONTHLY",
  "BudgetLimit": { "Amount": "500", "Unit": "USD" }
}`,
        explanation: "Create with `aws budgets create-budget --account-id 111122223333 --budget file://budget.json --notifications-with-subscribers file://alerts.json`, where alerts.json notifies at 80% of actual spend and 100% forecast.",
      },
      {
        title: "Tag resources and query cost",
        language: "bash",
        code: `aws ec2 create-tags --resources i-0123456789abcdef0 \\
  --tags Key=team,Value=checkout Key=env,Value=prod

aws ce get-cost-and-usage \\
  --time-period Start=2026-08-01,End=2026-09-01 \\
  --granularity MONTHLY --metrics UnblendedCost \\
  --group-by Type=TAG,Key=team`,
        explanation: "Tags must be activated as cost allocation tags in the billing console before they show up in cost reports.",
      },
      {
        title: "Support plan chooser",
        language: "text",
        code: `Situation                                         Plan
------------------------------------------------  -------------------
Learning, personal experiments                    Basic
Dev/test, can wait for business-hours answers     Developer
Production workloads needing 24/7 help            Business
Business-critical, want architectural guidance    Enterprise On-Ramp
Large critical estate, designated TAM             Enterprise`,
      },
    ],
    howItWorks: md(
      "Each service meters something: compute time, GB stored, requests, data transferred out. Inbound data transfer is generally free; transfer out to the internet and between Regions is usually charged. Usage is aggregated into a monthly bill. With Organizations, a **management account** pays for all **member accounts**, and usage across accounts is pooled to reach volume tiers sooner.",
      "Cost Explorer reads the same usage data and lets you filter by service, account, Region, or tag; Budgets compares it to thresholds you set and notifies via email or SNS.",
    ),
    diagram: `  Usage (compute, storage, transfer, requests)
          |
          v
   Monthly bill  <--- discounts: volume tiers, Savings Plans, RIs
          |
   +------+--------------+----------------+
   | Cost Explorer       | Budgets        | Tags
   | (analyse/forecast)  | (alert)        | (allocate by team)
   Pricing Calculator = estimate BEFORE building`,
    whyItExists: md(
      "Pay-as-you-go is only a benefit if you can see, predict, and control what you pay. Cost tools turn billing from an end-of-month surprise into something engineers can manage like any other metric.",
    ),
    whenToUse: md(
      "Estimate with the Pricing Calculator before building, set Budgets from day one, tag every resource, review Cost Explorer regularly, and pick a support plan that matches how critical your workloads are.",
    ),
    whenNotToUse: md(
      "Do not buy Enterprise support for a hobby project. Do not rely on the Calculator as a guarantee - it estimates. Do not buy Marketplace software without checking the license terms and per-hour fees.",
    ),
    commonMistakes: [
      "Forgetting to enable cost allocation tags, then finding reports ungrouped.",
      "Ignoring data transfer charges when estimating.",
      "Leaving idle resources (unattached volumes, unused IPs, forgotten instances).",
      "Confusing Budgets (alerts on thresholds) with Cost Explorer (analysis).",
      "Assuming Free Tier lasts forever or covers every service.",
      "Forgetting to activate cost allocation tags, then wondering why they are missing from reports.",
      "Ignoring data transfer out and cross-Region replication in cost estimates.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "State which tool: estimate a new architecture, alert at 80% of spend, analyse last quarter's costs by service." },
      { difficulty: "Medium", prompt: "Define a tagging scheme (team, env, project) and explain how it enables cost reports per team." },
      { difficulty: "Medium", prompt: "Build an estimate for a web app: two instances, a database, storage and 500 GB of data transfer. List which items you might forget." },
      { difficulty: "Hard", prompt: "Your monthly bill doubled. Walk through diagnosis with Cost Explorer, tags, CloudTrail, and Budgets, then prevent a repeat." },
    ],
    interviewQuestions: [
      { question: "What does consolidated billing give you?", answer: "One bill for all accounts in an organization, combined usage for volume discounts, and shared commitment discounts, while keeping per-account visibility." },
      { question: "Name the AWS Support plans.", answer: "Basic, Developer, Business, Enterprise On-Ramp, and Enterprise." },
      { question: "Which plan includes a designated Technical Account Manager?", answer: "Enterprise (Enterprise On-Ramp offers a pool of TAMs)." },
      { question: "Exam-style: Which tool estimates the cost of planned AWS resources? (A) Cost Explorer (B) Budgets (C) Pricing Calculator (D) Trusted Advisor", answer: "C." },
      { question: "Exam-style: Which tool sends alerts when costs exceed a threshold?", answer: "AWS Budgets." },
      { question: "Exam-style: Which AWS service lets you define custom billing groups with custom rates?", answer: "AWS Billing Conductor." },
      { question: "Is data transfer into AWS from the internet charged?", answer: "Generally no; data transfer out to the internet is charged." },
    ],
    prerequisites: ["ec2-pricing", "monitoring-and-auditing"],
    relatedTopics: ["well-architected-framework", "migration-and-innovation", "security-services", "block-file-object-storage"],
    keywords: ["billing", "free tier", "cost explorer", "budgets", "pricing calculator", "tags", "consolidated billing", "support plan", "tam", "marketplace", "data transfer", "billing conductor", "cur", "cost allocation tags", "tiered pricing", "free tier"],
  },

  {
    id: "migration-and-innovation",
    title: "Migration and Innovation",
    level: "advanced",
    description: "CAF perspectives, the 7 Rs of migration, data transfer tools, and AWS AI/ML services.",
    explanation: md(
      "**AWS Cloud Adoption Framework (CAF)** helps organizations plan their cloud journey through six **perspectives**: *Business*, *People*, *Governance*, *Platform*, *Security*, and *Operations*. The first three focus on business capabilities, the last three on technical ones.",
      "**The 7 Rs** are strategies for moving each application:",
      "- **Retire**: switch it off; nobody needs it.\n- **Retain**: leave it where it is for now.\n- **Rehost** (lift and shift): move it as is to EC2.\n- **Relocate**: move at the hypervisor level (for example VMware workloads) with little change.\n- **Repurchase**: replace with a SaaS product.\n- **Replatform** (lift, tinker and shift): small optimisations such as moving to a managed database.\n- **Refactor / re-architect**: redesign to use cloud-native features.",
      "**Moving data and servers**",
      "- **AWS Snow Family** (Snowball Edge devices): ruggedised appliances to move large amounts of data or run edge compute when networks are slow. Snowmobile (the truck-sized option) has been retired, and some smaller Snow devices have been discontinued for new customers, so check availability.\n- **AWS DataSync**: automates online transfers between on-premises storage and AWS storage.\n- **AWS Application Migration Service (MGN)**: replicates servers into AWS for rehosting. **Database Migration Service** handles databases.",
      "**Innovation with AI/ML**",
      "- **Amazon SageMaker**: build, train and deploy your own machine learning models.\n- **Amazon Bedrock**: access to foundation models through an API to build generative AI applications.\n- **Amazon Lex**: conversational chatbots.\n- **Amazon Transcribe**: speech to text.\n- **Amazon Polly**: text to speech.\n- **Amazon Comprehend**: text analysis (sentiment, entities).\n- **Amazon Textract**: extract text and structure from scanned documents.\n- **Amazon Rekognition**: image and video analysis.\n- **Amazon Translate**: language translation.\n- **Amazon Kendra** and similar services: intelligent search.",
      "**Benefits of the CAF**: following its perspectives brings more reliable cloud migrations, higher business value, lower risk, better alignment between business and IT, and clearer skills and roles across the organisation.",
      "**Discovery and tracking tools**: **AWS Application Discovery Service** collects server inventory, utilisation and dependencies from on-premises data centers; **AWS Migration Hub** gives one place to track migration progress across tools; **AWS Application Migration Service (MGN)** performs the lift-and-shift replication; **AWS Transfer Family** moves files over SFTP/FTPS; **DataSync**, **DMS** and the **Snow Family** move data. Use the **AWS Migration Evaluator** to build a business case.",
    ),
    analogy:
      "Migrating is like relocating a large household. Retire is donating the broken lamp, retain is keeping the piano in the old house for now, rehost is moving the sofa exactly as it is, replatform is swapping the heavy fridge for a built-in one, repurchase is buying a rental subscription instead of a washing machine, and refactor is redesigning the kitchen. Snowball is the container you fill and have shipped when the moving van would take forever.",
    examples: [
      {
        title: "Classifying a portfolio with the 7 Rs",
        language: "text",
        code: `Application              Decision      Why
-----------------------  ------------  -----------------------------------------
Old intranet wiki        Retire        Usage near zero
Mainframe billing        Retain        High risk; revisit in two years
Windows file server      Rehost        Quick win; no code change
VMware cluster           Relocate      Keep tooling, move the whole environment
Self-hosted email        Repurchase    Moves to a SaaS email product
On-prem MySQL app        Replatform    Same app, managed database (RDS)
Monolith order system    Refactor      Needs elasticity; split into services`,
      },
      {
        title: "DataSync task (CLI sketch)",
        language: "bash",
        code: `aws datasync create-task \\
  --source-location-arn arn:aws:datasync:eu-west-1:111122223333:location/loc-source \\
  --destination-location-arn arn:aws:datasync:eu-west-1:111122223333:location/loc-dest \\
  --name nightly-archive
aws datasync start-task-execution --task-arn arn:aws:datasync:eu-west-1:111122223333:task/task-0abc1234`,
        explanation: "The locations (source NFS/SMB share, destination S3 bucket) are created first and need an agent on premises.",
      },
      {
        title: "Which AI service?",
        language: "text",
        code: `Goal                                             Service
-----------------------------------------------  --------------
Train and host my own model                      SageMaker
Add generative AI via foundation models          Bedrock
Build a voice or text chatbot                    Lex
Turn call recordings into text                   Transcribe
Pull fields from scanned invoices                Textract
Find sentiment or entities in reviews            Comprehend
Detect objects in photos                         Rekognition`,
      },
    ],
    howItWorks: md(
      "A migration usually runs in phases: assess and discover the estate, plan with the CAF and the 7 Rs, build the landing zone (accounts, network, security), migrate in waves with replication tools, then optimise. Data transfer chooses between network (DataSync, VPN or Direct Connect) and physical devices depending on volume and available bandwidth - when the calculation says weeks or months online, shipping a device wins.",
      "AI services come in layers: ready-made APIs (Transcribe, Textract), a platform to build your own models (SageMaker), and foundation-model access (Bedrock). Choose the highest layer that meets your need.",
    ),
    diagram: `  Discover -> Plan (CAF, 7 Rs) -> Build landing zone -> Migrate -> Optimise
                                           |
                       Data: DataSync / network OR Snow device
                       Servers: Application Migration Service
                       Databases: SCT + DMS`,
    whyItExists: md(
      "Moving hundreds of applications without a plan creates chaos. Frameworks give a shared vocabulary for business and technical teams, while tooling reduces downtime and manual error. AI services let teams add intelligence without hiring a research lab.",
    ),
    whenToUse: md(
      "Use the 7 Rs when triaging an application portfolio, physical Snow devices for huge datasets over slow links, DataSync for recurring online transfers, and managed AI services before building custom models.",
    ),
    whenNotToUse: md(
      "Do not refactor everything - that is the costliest strategy. Do not ship a device for a small dataset that a network transfer can handle. Do not train a custom model when a managed API already solves the task.",
    ),
    commonMistakes: [
      "Treating every app as a rehost and getting no cloud benefit.",
      "Skipping the Retire step and migrating applications nobody uses.",
      "Ignoring data gravity: apps move easily, databases and data do not.",
      "Forgetting security and governance in the migration plan.",
      "Mixing up Textract (documents), Transcribe (audio) and Comprehend (text analysis).",
      "Starting a migration without discovery - hidden dependencies cause outages.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "List the six CAF perspectives and group them into business and technical capabilities." },
      { difficulty: "Medium", prompt: "Assign a Strategy to five applications of your choice and defend each." },
      { difficulty: "Medium", prompt: "Compute how long 200 TB takes over a 1 Gbps link (use the unit converter) and decide whether to ship a device." },
      { difficulty: "Hard", prompt: "Design a Textract plus Comprehend pipeline using S3, Lambda and SQS to process incoming invoices." },
    ],
    interviewQuestions: [
      { question: "Name the 7 Rs.", answer: "Retire, Retain, Rehost, Relocate, Repurchase, Replatform, Refactor." },
      { question: "CAF perspectives?", answer: "Business, People, Governance, Platform, Security, Operations." },
      { question: "When would you use a Snowball Edge?", answer: "To move large datasets or process data at the edge when network transfer is too slow, expensive or unavailable." },
      { question: "Exam-style: Which service lets you build generative AI apps using foundation models through an API?", answer: "Amazon Bedrock." },
      { question: "Exam-style: Which service extracts text and tables from scanned documents?", answer: "Amazon Textract." },
      { question: "Exam-style: Which service collects on-premises server utilisation and dependency data to plan a migration?", answer: "AWS Application Discovery Service." },
      { question: "Exam-style: Which service provides a single dashboard to track migrations?", answer: "AWS Migration Hub." },
      { question: "Name the six CAF perspectives.", answer: "Business, People, Governance, Platform, Security, Operations." },
    ],
    prerequisites: ["aws-databases", "block-file-object-storage", "vpc-networking"],
    relatedTopics: ["well-architected-framework", "pricing-and-billing", "serverless-and-containers", "security-services"],
    keywords: ["migration", "caf", "7 rs", "rehost", "replatform", "refactor", "snowball", "datasync", "sagemaker", "bedrock", "textract", "transcribe", "caf", "application discovery service", "migration hub", "mgn", "transfer family", "migration evaluator"],
  },

  {
    id: "well-architected-framework",
    title: "The Well-Architected Framework",
    level: "advanced",
    description: "The six pillars, their design principles, the Well-Architected Tool, and a multi-AZ example.",
    explanation: md(
      "The **AWS Well-Architected Framework** is a set of best practices for evaluating and improving cloud architectures. It has **six pillars**:",
      "- **Operational Excellence**: run and monitor systems, and keep improving. Principles: perform operations as code, make frequent small reversible changes, learn from failures.\n- **Security**: protect data and systems. Principles: strong identity foundation, traceability, security at all layers, automate security, protect data in transit and at rest, prepare for events.\n- **Reliability**: recover from failure and meet demand. Principles: automatically recover, test recovery procedures, scale horizontally, stop guessing capacity, manage change through automation.\n- **Performance Efficiency**: use resources efficiently as needs evolve. Principles: democratise advanced technologies, go global in minutes, use serverless, experiment more, consider mechanical sympathy.\n- **Cost Optimization**: avoid unnecessary spend. Principles: implement cloud financial management, adopt a consumption model, measure overall efficiency, stop spending on undifferentiated heavy lifting, analyse and attribute expenditure.\n- **Sustainability**: minimise environmental impact. Principles: understand your impact, set sustainability goals, maximise utilisation, adopt more efficient hardware and software, use managed services, reduce downstream impact.",
      "The **AWS Well-Architected Tool** (in the console) guides a review of a workload against the pillars and tracks improvement items. Pillars involve trade-offs - you balance them, you do not maximise each independently.",
    ),
    analogy:
      "Designing a building: you want it safe (security), reliable in storms (reliability), pleasant to run day to day (operational excellence), quick to move around in (performance), affordable (cost), and kind to the planet (sustainability). A glass tower might delight on looks and performance but cost more to heat - the pillars are the checklist that makes you notice the trade-off.",
    examples: [
      {
        title: "Making a web app multi-AZ (reliability + performance)",
        language: "yaml",
        code: `Resources:
  WebASG:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      MinSize: "2"
      MaxSize: "6"
      DesiredCapacity: "2"
      HealthCheckType: ELB
      HealthCheckGracePeriod: 120
      VPCZoneIdentifier:
        - !Ref PrivateSubnetA   # AZ a
        - !Ref PrivateSubnetB   # AZ b
      LaunchTemplate:
        LaunchTemplateId: !Ref WebLaunchTemplate
        Version: !GetAtt WebLaunchTemplate.LatestVersionNumber
      TargetGroupARNs:
        - !Ref WebTargetGroup
  Database:
    Type: AWS::RDS::DBInstance
    Properties:
      Engine: postgres
      DBInstanceClass: db.t4g.medium
      AllocatedStorage: "50"
      MultiAZ: true
      StorageEncrypted: true
      MasterUsername: appadmin
      ManageMasterUserPassword: true`,
        explanation: "Instances in two AZs behind a load balancer plus a Multi-AZ encrypted database means losing a data center does not take the app down. Required companion resources (VPC, subnets, launch template) are omitted for brevity.",
      },
      {
        title: "Review checklist by pillar",
        language: "text",
        code: `Pillar                  Quick review question
----------------------  -----------------------------------------------------
Operational Excellence  Is everything deployed from code and observable?
Security                Least privilege, encryption, logging, MFA everywhere?
Reliability             What happens if an AZ fails? Have we tested restore?
Performance Efficiency  Are we using the right instance/storage/DB type?
Cost Optimization       Are resources right-sized and tagged? Commitments used?
Sustainability          Are we maximising utilisation and removing idle resources?`,
      },
    ],
    howItWorks: md(
      "A Well-Architected Review asks a set of questions per pillar about a specific workload, identifies high and medium risk items, and produces an improvement plan. It is a conversation and an ongoing practice rather than a one-time pass/fail audit. The AWS Well-Architected Tool stores the answers, tracks milestones, and can generate a report. 'Lenses' extend the framework for specific industries and technologies, such as serverless or SaaS.",
    ),
    diagram: `            +--------- Operational Excellence ---------+
            |  Security | Reliability | Performance    |
            |  Cost Optimization | Sustainability      |
            +------------------------------------------+
   Review -> find risks -> improve -> measure -> repeat`,
    whyItExists: md(
      "Teams repeat the same architectural mistakes: single points of failure, wide permissions, forgotten costs. The framework distils lessons from many customer reviews so you can catch known problems before they become incidents.",
    ),
    whenToUse: md(
      "Review before launch, after major changes, and on a schedule for critical workloads. Use it as a design checklist and as shared language between engineers, managers and auditors.",
    ),
    whenNotToUse: md(
      "It will not make decisions for you or guarantee compliance. Do not apply every best practice at maximum to a small prototype - weigh cost and effort against business risk.",
    ),
    commonMistakes: [
      "Forgetting that there are six pillars - Sustainability was added after the original five.",
      "Optimising one pillar (e.g. cost) while silently sacrificing another (reliability).",
      "Treating the review as paperwork instead of acting on the findings.",
      "Reviewing once and never again.",
      "Confusing the Well-Architected Framework with the Cloud Adoption Framework.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Name all six pillars and give one design principle for each." },
      { difficulty: "Medium", prompt: "Take a simple architecture (single EC2 + RDS) and list risks by pillar." },
      { difficulty: "Medium", prompt: "Show how adding multi-AZ affects reliability, cost and operational complexity." },
      { difficulty: "Hard", prompt: "Choose between two designs (serverless vs EC2 fleet) using all six pillars and justify a recommendation." },
    ],
    interviewQuestions: [
      { question: "What are the six pillars?", answer: "Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization and Sustainability." },
      { question: "What does the Reliability pillar emphasise?", answer: "Recovering automatically from failures, testing recovery, scaling horizontally, and managing change." },
      { question: "What is the Well-Architected Tool?", answer: "A console service that helps you review workloads against the pillars and track improvements." },
      { question: "Exam-style: A company deploys across multiple AZs. Which pillar does this primarily support?", answer: "Reliability." },
      { question: "Exam-style: Which pillar covers using managed services and maximising utilisation to reduce environmental impact?", answer: "Sustainability." },
    ],
    prerequisites: ["aws-global-infrastructure", "auto-scaling-and-load-balancing", "security-services"],
    relatedTopics: ["pricing-and-billing", "monitoring-and-auditing", "migration-and-innovation", "scalability", "cloud-practitioner-exam"],
    keywords: ["well-architected", "pillars", "reliability", "operational excellence", "sustainability", "performance efficiency", "cost optimization", "multi-az"],
  },

  {
    id: "support-and-partner-resources",
    title: "Support Plans and Partner Resources",
    level: "advanced",
    description: "Support plans, Support Center, re:Post, Knowledge Center, Partner Network, Marketplace, Professional Services, Solutions Architects, IQ, AMS and Activate.",
    explanation: md(
      "AWS offers paid support plans and many free and paid resources to help you learn, solve problems and find expert partners.",
      "**Support plans** (all include 24/7 access to customer service, documentation, whitepapers, support forums, Health Dashboard and core Trusted Advisor checks):",
      "- **Basic**: free; account and billing support, and a limited set of Trusted Advisor checks.\n- **Developer**: business-hours email access to Cloud Support Associates; for testing and early development.\n- **Business**: 24/7 phone, chat and email with Cloud Support Engineers, full Trusted Advisor checks, and 1-hour response for production system impaired cases (newer Business Support+ adds faster responses and AI-assisted help).\n- **Enterprise On-Ramp**: adds a pool of Technical Account Managers, a Well-Architected review, and faster response (30 minutes for business-critical issues) for important workloads.\n- **Enterprise**: a designated TAM, infrastructure event management, concierge for billing and the fastest response (15 minutes for business-critical system down).\nPlan names, prices and response times change, so verify on the AWS Support page.",
      "**Where to get help**",
      "- **AWS Support Center**: open and manage cases.\n- **AWS re:Post**: community Q&A, the successor to the AWS forums.\n- **AWS Knowledge Center**: answers to frequently asked support questions.\n- **AWS Prescriptive Guidance**: strategies, guides and patterns for migration and modernization.\n- **AWS Trust & Safety**: report abuse of AWS resources such as spam, malware or DDoS originating from AWS.\n- **Documentation, whitepapers, blogs, Well-Architected resources and AWS Skill Builder** for self-paced training.",
      "**Partners and professional help**",
      "- **AWS Partner Network (APN)**: companies that build on or resell AWS. **Independent software vendors (ISVs)** offer software on AWS; **systems integrators (SIs)** and consulting partners design and implement solutions. Partner benefits include training, technical support, co-marketing, and sales support; partners can earn tiers and **competencies** that signal expertise.\n- **AWS Marketplace**: digital catalog of third-party software, data and services. Features: pay-as-you-go or subscription pricing, charges on your AWS bill, free trials, private offers, and quick deployment (AMIs, SaaS, containers).\n- **AWS Professional Services**: AWS consultants who help deliver specific outcomes. **Solutions Architects** give free architecture guidance. **AWS IQ** connects you with certified freelance experts. **AWS Managed Services (AMS)** operates your AWS infrastructure for you. **AWS Activate** gives startups credits, training and support.",
    ),
    analogy:
      "Support plans are like roadside-assistance memberships: Basic is the free emergency number, Developer a weekday helpline, Business a 24/7 mechanic, and Enterprise your own named mechanic who knows your car. Partners are the garages and dealers, Marketplace is the accessory shop, and Professional Services is a consultant who comes to your driveway.",
    examples: [
      {
        title: "Which plan fits?",
        language: "text",
        code: `Situation                                          Plan
-------------------------------------------------  ---------------------
Learning on a personal account                     Basic
Testing a prototype, business-hours help is fine   Developer
Production workload needs 24/7 engineers           Business
Critical workloads, wants a pool of TAMs           Enterprise On-Ramp
Mission-critical, wants a designated TAM           Enterprise`,
        explanation: "Match urgency and operational criticality: the higher the stakes, the faster the response and the more proactive the help.",
      },
      {
        title: "Open a support case from the CLI",
        language: "bash",
        code: `# Requires a Business or higher plan
aws support create-case \\
  --subject "Production RDS failover question" \\
  --service-code amazon-rds --severity-code high \\
  --communication-body "Describe what happened and when." \\
  --language en`,
        explanation: "The Support API is available only with Business, Enterprise On-Ramp or Enterprise plans.",
      },
    ],
    howItWorks: md(
      "Support plans differ in **who answers** (associate vs engineer vs TAM), **how fast** (response times by severity), **what is included** (Trusted Advisor checks, architecture reviews, event management), and **price** (a monthly minimum or percentage of usage). Upgrade for a month when you need help, then downgrade, because plans bill monthly with no long-term contract.",
      "Partners join the APN through requirements such as training and validated customer success. Marketplace sellers publish listings; buyers subscribe, and AWS bills the charges alongside regular AWS usage.",
    ),
    diagram: `  Self-service (free)       Paid help               Experts
  re:Post, Knowledge        Support plans:          Partners (ISV, SI)
  Center, docs, Skill       Basic < Developer <     Professional Services
  Builder, Prescriptive     Business < On-Ramp <    Solutions Architects
  Guidance                  Enterprise (TAM)        IQ, AMS, Marketplace`,
    whyItExists: md(
      "Cloud adoption needs guidance. Some customers want only documentation; others need engineers on call or a partner to design a whole migration. A tiered offering lets each pay for the level of help that matches their risk.",
    ),
    whenToUse: md(
      "Choose a support plan based on production criticality. Use re:Post and Knowledge Center first for common questions, Partners or Professional Services for large projects, Marketplace to buy ready-made software, IQ for short expert tasks, AMS when you want AWS to operate your environment, and Activate when you are a startup.",
    ),
    whenNotToUse: md(
      "Do not run business-critical production on Basic or Developer expecting 24/7 engineer help. Do not rely on Trust & Safety for account or billing problems - that is Support or Customer Service.",
    ),
    commonMistakes: [
      "Believing Basic includes technical support cases (it covers billing and account issues).",
      "Confusing a TAM (Enterprise) with an AWS Solutions Architect (free pre-sales guidance).",
      "Treating AWS Marketplace as free software - you pay the vendor's price through AWS billing.",
      "Reporting abuse through a support case instead of the Trust & Safety team.",
      "Forgetting that plan features and response times can change; check current AWS documentation.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Order the five support plans from least to most support and name one feature that appears at each step." },
      { difficulty: "Medium", prompt: "A startup runs a production app and has one engineer on call. Recommend a plan and justify it." },
      { difficulty: "Medium", prompt: "List four benefits of buying software through AWS Marketplace." },
      { difficulty: "Hard", prompt: "A company is migrating hundreds of servers. Describe which partner and AWS resources you would use at each phase." },
    ],
    interviewQuestions: [
      { question: "Exam-style: Which support plan first provides a designated Technical Account Manager?", answer: "Enterprise Support (Enterprise On-Ramp offers a pool of TAMs)." },
      { question: "Exam-style: Which plan is the cheapest to include 24/7 access to Cloud Support Engineers?", answer: "Business Support." },
      { question: "Exam-style: Where do you report an AWS resource being used to send spam?", answer: "AWS Trust & Safety." },
      { question: "Exam-style: Which resource is a community-driven Q&A site for AWS questions?", answer: "AWS re:Post." },
      { question: "Exam-style: Which AWS service lets you find and buy third-party software with charges on your AWS bill?", answer: "AWS Marketplace." },
      { question: "Exam-style: Which offering operates a customer's AWS infrastructure for them?", answer: "AWS Managed Services (AMS)." },
      { question: "Exam-style: Which program helps startups with credits and training?", answer: "AWS Activate." },
      { question: "What does an ISV do versus an SI in the AWS Partner Network?", answer: "An ISV builds software products that run on AWS; a systems integrator designs and implements solutions for customers." },
    ],
    prerequisites: ["pricing-and-billing"],
    relatedTopics: ["pricing-and-billing", "governance-and-management", "migration-and-innovation", "cloud-practitioner-exam"],
    keywords: ["support plans", "developer support", "business support", "enterprise on-ramp", "enterprise support", "tam", "support center", "re:post", "knowledge center", "prescriptive guidance", "trust and safety", "apn", "isv", "marketplace", "professional services", "solutions architect", "iq", "ams", "activate"],
  },

  {
    id: "cloud-practitioner-exam",
    title: "AWS Cloud Practitioner Exam (CLF-C02)",
    level: "advanced",
    description: "Exam format and domains, a study plan, question strategies, and a task-statement map, and a 25-question practice set.",
    explanation: md(
      "The **AWS Certified Cloud Practitioner** exam (code **CLF-C02**) validates foundational cloud knowledge. It is meant for people from technical and non-technical roles alike, and no prior AWS experience is required.",
      "**Format**: 65 questions in 90 minutes: **50 are scored and 15 are unscored** items AWS uses to evaluate future questions, and you cannot tell which is which, so answer every question. Question types are **multiple choice** (one correct answer out of four options) and **multiple response** (two or more correct answers out of five or more options). There is **no penalty for guessing**: an unanswered question counts as incorrect, so never leave one blank.",
      "**Scoring**: the exam is pass/fail. Results are reported as a **scaled score from 100 to 1,000** and the **minimum passing score is 700**. Scoring is **compensatory**: you pass by your overall score, not by passing each domain, so a weak area can be offset by strength elsewhere.",
      "**Version and audience**: **CLF-C02 replaced CLF-C01 on 19 September 2023** and added a new task statement on the AWS Cloud Adoption Framework (CAF). The target candidate has up to **6 months of exposure to AWS Cloud** in any role, and people from non-IT backgrounds (sales, finance, management, project roles) are welcome. **Out of scope**: coding, designing cloud architecture, troubleshooting, implementation, and load or performance testing.",
      "**Domains and weights**",
      "- **Cloud Concepts**: 24%\n- **Security and Compliance**: 30%\n- **Cloud Technology and Services**: 34%\n- **Billing, Pricing, and Support**: 12%",
      "**Task-statement map** (official exam guide numbering to the lessons that cover it):",
      "- **1.1** Benefits of the AWS Cloud: what-is-cloud-computing\n- **1.2** Design principles: well-architected-framework\n- **1.3** Migration benefits and strategies (including CAF): migration-and-innovation\n- **1.4** Cloud economics: what-is-cloud-computing, ec2-pricing, pricing-and-billing\n- **2.1** Shared responsibility model: shared-responsibility-model\n- **2.2** Security, governance and compliance concepts: security-services, monitoring-and-auditing, governance-and-management\n- **2.3** Access management: iam-basics\n- **2.4** Security components and resources: security-services, network-security\n- **3.1** Deploying and operating methods: interacting-with-aws, developer-and-end-user-tools, governance-and-management\n- **3.2** Global infrastructure: aws-global-infrastructure\n- **3.3** Compute: ec2-basics, auto-scaling-and-load-balancing, serverless-and-containers\n- **3.4** Databases: aws-databases\n- **3.5** Networking: vpc-networking, network-security, dns-and-cdn\n- **3.6** Storage: block-file-object-storage\n- **3.7** AI/ML and analytics: migration-and-innovation, analytics-services\n- **3.8** Other in-scope services (integration, end-user, developer, IoT): application-integration, messaging-sqs-sns, developer-and-end-user-tools\n- **4.1** Pricing models: ec2-pricing, pricing-and-billing\n- **4.2** Billing, budget and cost management: pricing-and-billing\n- **4.3** Technical resources and support options: support-and-partner-resources, monitoring-and-auditing",
      "Check the official exam guide before booking: details, languages and fees can change, and the AWS site is the authority.",
      "**Study plan** (adapt to your time):",
      "- Week 1: Cloud concepts, global infrastructure, shared responsibility, IAM.\n- Week 2: Compute, storage, databases, networking.\n- Week 3: Security services, monitoring, pricing, support, Well-Architected, migration.\n- Week 4: Hands-on in a free account, then timed practice sets, then review your weak areas.",
    ),
    analogy:
      "Preparing for the exam is like learning a new city before a visit. You do not need the name of every alley; you need the map (domains), the main landmarks (core services), the transport rules (pricing and support), and a feel for the neighbourhood from actually walking around (hands-on labs).",
    examples: [
      {
        title: "Service-to-need cheat grid",
        language: "text",
        code: `Need                              Think
--------------------------------  ----------------------------------
Virtual server                    EC2
Run code on events                Lambda
Object storage                    S3
Managed relational DB             RDS / Aurora
NoSQL at scale                    DynamoDB
DNS                               Route 53
CDN                               CloudFront
Audit API calls                   CloudTrail
Metrics and alarms                CloudWatch
Compliance reports                Artifact
Estimate cost                     Pricing Calculator
Alert on cost                     Budgets
Move big data physically          Snow Family`,
      },
      {
        title: "Tick off each service hands-on (free-tier friendly)",
        language: "bash",
        code: `aws s3 mb s3://my-practice-bucket-12345
aws iam list-users --max-items 3
aws cloudwatch list-metrics --namespace AWS/EC2 --max-items 3
aws ec2 describe-regions --output table
aws cloudtrail lookup-events --max-results 3
# Delete everything you created when finished.`,
        explanation: "Small hands-on repetitions make names and concepts stick far better than reading alone.",
      },
    ],
    howItWorks: md(
      "**Question strategies**",
      "- Read the last sentence first to see what is being asked, then the scenario.\n- Look for keywords: 'lowest cost', 'least operational overhead', 'highly available', 'compliance report', 'decouple'.\n- Eliminate options that are clearly wrong - often two of four are easy to rule out.\n- For multiple-response questions, the prompt states how many answers to choose.\n- Do not leave anything blank; flag hard questions and return.\n- Remember the shared-responsibility split when a question asks 'who is responsible'.",
      "Use the 25-question practice set below (in the interview questions) as a timed quiz: answer each before opening it.",
    ),
    diagram: `  Domains by weight
  Cloud Technology & Services  34% ################
  Security & Compliance        30% ##############
  Cloud Concepts               24% ###########
  Billing, Pricing, Support    12% #####
  Format: 65 questions (50 scored) | 90 minutes | pass 700 of 1000`,
    whyItExists: md(
      "A certification gives a structured path through a huge catalogue of services and a credential that tells employers you share the common vocabulary. The exam only samples the basics, so it also doubles as a map for deeper study.",
    ),
    whenToUse: md(
      "Take it as a first AWS credential, to move into cloud-adjacent roles (sales, project management, support) or as a foundation before associate-level certifications.",
    ),
    whenNotToUse: md(
      "If you already work hands-on with AWS daily, an associate-level exam may match your level better. Do not memorise question dumps - they are against exam rules and teach the wrong things.",
    ),
    commonMistakes: [
      "Memorising service names without knowing what problem each solves.",
      "Skipping the pricing and support domain because it is the smallest - it is easy points.",
      "Over-reading: choosing exotic answers when the simple service fits.",
      "Not practising under time limits.",
      "Studying from outdated material that predates the Sustainability pillar or current support plans.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write the four domains and their weights from memory." },
      { difficulty: "Medium", prompt: "Make flashcards: service name on one side, the problem it solves on the other, for the top 30 services." },
      { difficulty: "Medium", prompt: "Build a personal study plan with dates, hands-on labs, and two timed practice sets." },
      { difficulty: "Hard", prompt: "Write five original exam-style questions (with distractors and explanations) for the Security domain." },
    ],
    interviewQuestions: [
      { question: "How many questions, how long, and what is the pass mark for CLF-C02?", answer: "65 questions in 90 minutes (50 scored, 15 unscored); scaled score 100-1,000 with 700 required to pass; no guessing penalty." },
      { question: "Which domain has the highest weight?", answer: "Cloud Technology and Services at 34%." },
      { question: "Practice 1: Which Region factor is considered first when data must stay in a country by law?", answer: "Compliance." },
      { question: "Practice 2: Which AWS service distributes traffic across multiple EC2 instances?", answer: "Elastic Load Balancing." },
      { question: "Practice 3: Who patches the guest operating system on an EC2 instance?", answer: "The customer." },
      { question: "Practice 4: Which pricing option suits fault-tolerant batch jobs at the lowest cost?", answer: "Spot Instances." },
      { question: "Practice 5: Which storage class is the lowest-cost for long-term archive with rare access?", answer: "S3 Glacier Deep Archive." },
      { question: "Practice 6: Which service records API calls for governance and auditing?", answer: "AWS CloudTrail." },
      { question: "Practice 7: Which service provides DDoS protection automatically at no extra charge?", answer: "AWS Shield Standard." },
      { question: "Practice 8: Which tool estimates the cost of an architecture before deployment?", answer: "AWS Pricing Calculator." },
      { question: "Practice 9: Which database service is a fully managed NoSQL key-value store with millisecond latency?", answer: "Amazon DynamoDB." },
      { question: "Practice 10: Which VPC component gives private subnets outbound internet access without inbound exposure?", answer: "A NAT gateway." },
      { question: "Practice 11: What are the six Well-Architected pillars?", answer: "Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, Sustainability." },
      { question: "Practice 12: Which service lets you download AWS's compliance reports?", answer: "AWS Artifact." },
      { question: "Practice 13: Which migration strategy moves an application as is to EC2 with no changes?", answer: "Rehost (lift and shift)." },
      { question: "Practice 14: Which service sends one message to many subscribers?", answer: "Amazon SNS." },
      { question: "Practice 15: Which support plan first includes a designated Technical Account Manager?", answer: "Enterprise (Enterprise On-Ramp has a pool of TAMs)." },

      { question: "Practice 16: Which service provides a dedicated private network connection from a data center to AWS?", answer: "AWS Direct Connect." },
      { question: "Practice 17: Which service runs SQL queries on data in S3 without servers?", answer: "Amazon Athena." },
      { question: "Practice 18: A company wants to cut idle cost by choosing smaller instance types after reviewing usage. What is this called?", answer: "Rightsizing (AWS Compute Optimizer can recommend it)." },
      { question: "Practice 19: Which service enables single sign-on across multiple AWS accounts for workforce users?", answer: "AWS IAM Identity Center." },
      { question: "Practice 20: Which service records configuration changes and evaluates compliance against rules?", answer: "AWS Config." },
      { question: "Practice 21: Which AWS Support resource is a community Q&A site?", answer: "AWS re:Post." },
      { question: "Practice 22: Which design principle is described by 'treat servers as disposable and automate everything'?", answer: "Automation and loosely coupled design (a Well-Architected design principle)." },
      { question: "Practice 23: Which feature lets you set a spending threshold and be alerted?", answer: "AWS Budgets." },
      { question: "Practice 24: Which service provides managed SFTP endpoints into Amazon S3?", answer: "AWS Transfer Family." },
      { question: "Practice 25: Which CAF perspective covers identity, compliance and data protection?", answer: "The Security perspective." },    ],
    prerequisites: ["well-architected-framework", "pricing-and-billing"],
    relatedTopics: ["what-is-cloud-computing", "shared-responsibility-model", "iam-basics", "security-services", "migration-and-innovation"],
    keywords: ["clf-c02", "cloud practitioner", "certification", "exam", "study plan", "practice questions", "domains"],
  },
];
