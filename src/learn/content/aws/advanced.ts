import type { Topic } from "../../types/content";
import { md } from "./md";

export const awsAdvancedTopics: Topic[] = [
  {
    id: "security-services",
    title: "AWS Security Services",
    level: "advanced",
    description: "Organizations and SCPs, Artifact, Shield, WAF, KMS and CloudHSM, Inspector, GuardDuty, Security Hub, Macie, plus zero trust, cryptography and compliance basics.",
    explanation: md(
      "Beyond IAM and network rules, AWS has many security services. Group them by the job they do.",
      "**Governance and compliance**",
      "- **AWS Organizations**: manage many accounts centrally with **organizational units (OUs)**, consolidated billing and **service control policies (SCPs)**. SCPs set the *maximum* permissions accounts can have. They never grant access on their own.\n- **AWS Artifact**: self-service portal for AWS compliance reports and agreements.\n- **AWS Config / CloudTrail**: configuration compliance and audit trail (see monitoring).\n- **AWS Audit Manager**: keeps collecting evidence (from Config, CloudTrail, Security Hub and others) and maps it to frameworks such as SOC 2 or PCI DSS for audit-ready reports. It does not make you compliant; you still need an auditor. Exam tip: Security Hub CSPM = posture score, Audit Manager = audit evidence.",
      "**Protecting against attacks**",
      "- A **DDoS attack** floods a target with traffic from many compromised machines.\n- **Shield Standard**: free and automatic for all customers. Protects against common **layer 3 (network) and layer 4 (transport)** attacks, especially for traffic through CloudFront and Route 53.\n- **Shield Advanced**: a paid subscription for CloudFront, Route 53, ELB, Global Accelerator and Elastic IPs. Adds better detection and visibility, access to the **Shield Response Team** (needs a Business-level or higher support plan), **DDoS cost protection** and an SLA. Pair it with AWS WAF for **layer 7 (application)** protection.\n- **AWS WAF**: a web application firewall. **Web ACLs** hold your own rules, **AWS Managed Rules** or Marketplace rule groups to block SQL injection, cross-site scripting, bad IPs, rate-limit abuse and bots (Bot Control). Attaches to CloudFront, Application Load Balancer, API Gateway REST APIs, AppSync and Cognito user pools, **not** to a Network Load Balancer.\n- **AWS Network Firewall**: managed stateful firewall and intrusion prevention for VPCs.\n- **AWS Firewall Manager**: centrally applies WAF rules, Shield Advanced, security groups, network ACLs, Network Firewall, Route 53 Resolver DNS Firewall and third-party firewalls across accounts. Needs AWS Organizations, a Firewall Manager administrator account and AWS Config.",
      "**Protecting data**",
      "- **AWS KMS** (Key Management Service): create and control encryption keys. **Encryption at rest** protects stored data (S3, EBS, RDS). **Encryption in transit** protects data moving over the network with TLS.\n- **AWS Secrets Manager**: stores and automatically rotates secrets such as database passwords and API keys. Parameter Store is a related option.\n- **AWS Certificate Manager (ACM)**: provisions, manages and renews public and private TLS certificates for services like CloudFront and load balancers.\n- **AWS CloudHSM**: single-tenant hardware security modules you control (details below).\n- **Amazon Macie**: uses machine learning to find sensitive data (like personal information) in S3.",
      "**Detecting threats and weaknesses**",
      "- **Amazon GuardDuty**: must be switched on. Then it uses machine learning, anomaly detection and threat intelligence on **CloudTrail events, VPC Flow Logs and DNS logs** (with optional protection for S3, EKS, RDS, Lambda, malware and runtime). A classic finding is use of the root user's credentials. Findings can trigger automatic responses through **EventBridge**, and one delegated administrator account can manage it across an organization.\n- **Amazon Inspector**: continuously scans EC2 instances, container images in ECR and Lambda functions for software vulnerabilities and unintended network exposure. (The older agent-based \"Inspector Classic\" is retired.)\n- **Amazon Detective**: builds a graph of related logs to find the root cause of a finding. Pipeline to remember: CloudTrail records, GuardDuty detects, Detective investigates.\n- **AWS Security Hub CSPM** (the original Security Hub, renamed in June 2025): cloud security posture management. Turn on security standards (such as CIS or AWS Foundational Security Best Practices, built on AWS Config rules) and get a security score plus collected findings.\n- **AWS Security Hub** (the new service with that name): correlates findings from Security Hub CSPM, GuardDuty, Inspector and Macie into prioritised risks. Older study material says \"Security Hub\" for the posture-score service.",
      "**Identity and sharing**",
      "- **AWS IAM Identity Center** (formerly AWS Single Sign-On): the recommended way to give your workforce one sign-in to all accounts in AWS Organizations, plus single sign-on to SAML business apps. Identities can live in its built-in directory, in Active Directory (AWS Managed Microsoft AD or AD Connector), or in an external SAML 2.0 identity provider such as Microsoft Entra ID (formerly Azure AD) or Okta.\n- **Amazon Cognito**: sign-up, sign-in and access control for your web and mobile app users (customer identity). IAM is for your workforce.\n- **AWS Directory Service**: managed Microsoft Active Directory in AWS, plus AD Connector and Simple AD options.\n- **AWS Resource Access Manager (RAM)**: shares resources such as subnets or Transit Gateways with other accounts without copying them.",
      "**Security resources**: AWS Trusted Advisor security checks, the AWS Knowledge Center, security blogs, whitepapers, AWS Marketplace security products, and the Artifact portal for compliance reports.",
      "**Security concepts the exam expects**",
      "- **Zero trust**: \"never trust, always verify\". With remote work and personal devices, the network edge is no longer a reliable wall, so **identity becomes the main security perimeter**. Identity controls add to network controls (firewalls, VPNs); they do not replace them. On AWS the building blocks are IAM policies, permissions boundaries, SCPs and IAM conditions (source IP, Region, MFA, time of day). **AWS Verified Access** gives VPN-less, identity- and device-aware access to internal apps.\n- **Defense in depth**: layers of protection from the inside out: data, application, compute, network, perimeter (for example DDoS filtering), identity and access, physical. If one layer fails, the next still protects you.\n- **CIA triad**: **confidentiality** (only the right people see data, e.g. encryption), **integrity** (data stays accurate and untampered, e.g. hashing, tamper-evident HSMs) and **availability** (data is reachable when needed, e.g. multi-AZ, DDoS protection). Improving one often costs another.\n- **Vulnerability**: a design flaw or bug an attacker can exploit, such as missing input validation, weak cryptography or too-broad permissions. The **OWASP Top 10** lists the most common web app risks (SQL injection, cross-site scripting and so on).\n- **Hardening**: removing as many risks as possible from a system, often by checking it against a benchmark such as the **CIS Benchmarks**.",
      "**Cryptography basics**",
      "- **Encryption** turns readable plaintext into ciphertext using a key and an algorithm (cipher). **Symmetric** encryption uses one shared key to encrypt and decrypt (AES, used across AWS). **Asymmetric** encryption uses a key pair: one key encrypts, the other decrypts (RSA).\n- **Hashing** turns any input into a fixed-size output. It is one-way and always gives the same result for the same input, which is why passwords are stored as hashes. A **salt** (a random value added before hashing) makes identical passwords produce different hashes. Avoid MD5; use SHA-256 or bcrypt.\n- **Digital signatures**: a private key signs and the public key verifies. This proves who sent something and that it was not changed. SSH key pairs and code signing work this way.\n- **In transit vs at rest**: TLS (1.2 or 1.3; SSL is obsolete) protects data moving over a network. AES-style encryption protects stored data.",
      "**Keys and HSMs in more detail**",
      "- A **hardware security module (HSM)** stores keys in tamper-resistant hardware. **FIPS 140** is the US/Canadian standard for cryptographic modules. Level 3 adds tamper resistance and response on top of Level 2's tamper evidence. FIPS 140-3 is the current version.\n- **AWS KMS** is a managed, multi-tenant service. Its HSMs are **FIPS 140-3 Level 3 validated**. Many services encrypt with KMS through one setting (EBS, RDS, DynamoDB, S3). **AWS managed keys** are created for you. **Customer managed keys** let you write key policies, control rotation, and separate key administrators from key users. KMS uses **envelope encryption**: a data key encrypts your data, and the KMS key (which never leaves KMS) encrypts the data key.\n- **AWS CloudHSM** gives you **dedicated, single-tenant HSMs** in your VPC. AWS handles hardware, patching and backups, but only you control the keys. It supports standard APIs (PKCS#11, Java JCE, Microsoft CNG, OpenSSL) and can back a KMS custom key store. It costs much more than KMS, so pick it for strict regulatory or key-control needs.\n- Exam trap: older material says \"KMS = FIPS Level 2, CloudHSM = Level 3\". That is outdated. The real difference today is **multi-tenant and AWS-managed (KMS)** vs **single-tenant and customer-controlled (CloudHSM)**.",
      "**Compliance programs and proof**",
      "- Know the common names: **ISO/IEC 27001** (information security management), **27017** (cloud security controls), **27018** (personal data in the cloud), **27701** (privacy management); **SOC 1** (financial reporting controls), **SOC 2** (security and availability controls), **SOC 3** (public summary); **PCI DSS** (card payments); **HIPAA** (US health data); **FedRAMP** (US government cloud); **GDPR** (EU personal data); **FIPS 140** (crypto modules); **CSA STAR** (cloud provider security); **CJIS** (US criminal justice data).\n- The **AWS Compliance Programs** page lists what AWS supports. **AWS Artifact** is where you download the actual reports (SOC, PCI, ISO, FedRAMP) and accept agreements such as a **HIPAA Business Associate Addendum (BAA)**. Artifact answers \"why should we trust AWS?\". Do not confuse it with **AWS CodeArtifact**, a package repository.",
      "**Penetration testing**: you may pen-test your own resources on approved services (EC2, ELB, RDS, Aurora, CloudFront, API Gateway, Lambda, Lightsail, Elastic Beanstalk and others) **without asking AWS first**.",
      "- Prohibited: DNS zone walking on Route 53 hosted zones, DoS/DDoS or simulated DoS (there is a separate DDoS simulation testing policy), and port, protocol or request flooding.\n- Other simulated events, such as red-team or phishing exercises, need a request form.",
      "**Look-alike services**: **Inspector** scans your workloads for vulnerabilities. **Trusted Advisor** gives account-wide best-practice checks (cost, performance, security, fault tolerance, service quotas, operational excellence). **Artifact** gives you AWS's compliance reports; **Inspector** reports on the security of *your* workloads.",
    ),
    analogy:
      "Securing an account is like running a museum. Organizations and SCPs are museum-wide rules no gallery manager can override. Shield and WAF are the barriers and bag checks at the entrance. KMS is the locksmith holding the keys to the display cases. Inspector checks locks and windows for weak spots, GuardDuty is the camera system spotting odd behavior, Macie finds valuables left unlabeled on tables, and Security Hub is the control room with every alert on one screen.",
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
        explanation: "Attached to an OU, this limits every account in it to two Regions and stops anyone, even admins, from switching off auditing.",
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
      "**SCP evaluation**: an action is allowed only if the account's IAM permissions allow it *and* no SCP on the path from the organization root to the account blocks it. **Envelope encryption** in KMS: a KMS key encrypts a small data key, and the data key encrypts your data. Services do this for you.",
      "Detection services run all the time. GuardDuty reads CloudTrail, VPC flow logs and DNS logs. Inspector scans on events like new images. Macie samples S3 contents. Findings go to Security Hub for triage and can trigger automatic responses through EventBridge and Lambda.",
    ),
    diagram: `   Organization root
      |-- OU: Prod  ----- SCPs (max permissions)
      |      '-- accounts
      '-- OU: Dev
  Edge:   Shield + WAF  -->  CloudFront / ALB
  Data:   KMS keys  -->  S3 / EBS / RDS encryption
  Detect: GuardDuty + Inspector + Macie --> Security Hub --> alerts`,
    whyItExists: md(
      "Attacks, mistakes and compliance demands grow with scale. Central guardrails and automatic detection let small teams protect many accounts the same way, without relying on every engineer remembering everything.",
    ),
    whenToUse: md(
      "Use Organizations from the start for a multi-account setup, encrypt by default with KMS, put WAF and Shield in front of public apps, and turn on GuardDuty, Inspector and Security Hub as baseline detection.",
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
      "Repeating the old rule \"KMS is FIPS Level 2, CloudHSM is Level 3\" - KMS HSMs are now FIPS 140-3 Level 3; the real difference is multi-tenant vs single-tenant control.",
      "Trying to attach AWS WAF to a Network Load Balancer (it works with CloudFront, ALB, API Gateway, AppSync and Cognito).",
      "Expecting Shield Standard to stop layer 7 attacks - application-layer filtering needs AWS WAF.",
      "Confusing AWS Artifact (AWS compliance reports) with AWS CodeArtifact (software packages) or with Amazon Inspector (your workloads' vulnerabilities).",
      "Thinking Audit Manager makes you compliant - it gathers evidence; an auditor still assesses it.",
      "Running a load or flood test against AWS endpoints and calling it a pen test - DoS and flooding are prohibited.",
      "Using MD5 or unsalted hashes for passwords.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Match each to its job: Artifact, KMS, WAF, Macie, GuardDuty, Inspector." },
      { difficulty: "Medium", prompt: "Write an SCP that prevents leaving the organization and explain why attaching it at an OU is safer than at each account." },
      { difficulty: "Medium", prompt: "Explain encryption at rest vs in transit with one AWS example each." },
      { difficulty: "Hard", prompt: "GuardDuty reports an EC2 instance contacting a known malicious IP. Outline a response: isolate, investigate with logs, rotate credentials, remediate." },
      { difficulty: "Easy", prompt: "Give one AWS example for each part of the CIA triad: confidentiality, integrity, availability." },
      { difficulty: "Medium", prompt: "List the defense-in-depth layers from data outwards and name one AWS service or feature that protects each layer." },
      { difficulty: "Medium", prompt: "A regulator requires that only your company can ever access the encryption keys, on dedicated hardware. Choose between KMS and CloudHSM and explain the trade-offs." },
      { difficulty: "Hard", prompt: "Design a zero trust access setup for 20 accounts: IAM Identity Center with an external IdP, SCPs, IAM conditions requiring MFA, and Verified Access for an internal web app." },
    ],
    interviewQuestions: [
      { question: "What is an SCP?", answer: "A policy in AWS Organizations that sets the maximum available permissions for accounts in an OU or the organization; it does not grant permissions." },
      { question: "Shield Standard vs Advanced?", answer: "Standard is automatic and free for all customers against common network and transport layer attacks. Advanced is paid and adds extended protections, 24/7 response team access and cost protection." },
      { question: "What does KMS do?", answer: "Creates, stores and controls cryptographic keys used to encrypt data in AWS services and applications." },
      { question: "Exam-style: Which service finds sensitive data such as PII in S3?", answer: "Amazon Macie." },
      { question: "Exam-style: Where can a customer download AWS compliance reports?", answer: "AWS Artifact." },
      { question: "Exam-style: Which service rotates database credentials automatically?", answer: "AWS Secrets Manager." },
      { question: "Exam-style: Which service manages TLS certificates for a CloudFront distribution?", answer: "AWS Certificate Manager." },
      { question: "Exam-style: Which service enforces WAF rules across all accounts in an organization?", answer: "AWS Firewall Manager." },
      { question: "Exam-style: Which service analyses CloudTrail events, VPC Flow Logs and DNS logs to detect malicious activity?", answer: "Amazon GuardDuty." },
      { question: "Exam-style: Which service continuously scans EC2 instances, ECR images and Lambda functions for software vulnerabilities?", answer: "Amazon Inspector." },
      { question: "Exam-style: Which service collects evidence and maps it to frameworks like SOC 2 to prepare for an audit?", answer: "AWS Audit Manager." },
      { question: "Exam-style: A company needs single-tenant HSMs where only it controls the keys. Which service?", answer: "AWS CloudHSM." },
      { question: "Exam-style: Where does a healthcare customer accept the AWS HIPAA Business Associate Addendum?", answer: "AWS Artifact (Agreements)." },
      { question: "Exam-style: Which Shield Advanced feature requires a Business-level or higher support plan?", answer: "Access to the Shield Response Team (SRT)." },
      { question: "Exam-style: Which service gives one workforce sign-in across all accounts in AWS Organizations?", answer: "AWS IAM Identity Center (formerly AWS Single Sign-On)." },
      { question: "Do you need AWS approval to pen-test your own EC2 instances?", answer: "No, for the listed approved services you can test without prior approval, but DoS, flooding and Route 53 zone walking are prohibited." },
      { question: "What is zero trust?", answer: "A model that verifies every request and treats identity, not the network location, as the main security perimeter." },
      { question: "What is the difference between Security Hub CSPM and the new AWS Security Hub?", answer: "Security Hub CSPM (the original service) runs posture checks against standards and aggregates findings; the new Security Hub correlates findings from CSPM, GuardDuty, Inspector and Macie into prioritised risks." },
      { question: "What is the difference between hashing and encryption?", answer: "Encryption is reversible with the right key; hashing is one-way and is used to verify data such as passwords." },
    ],
    prerequisites: ["iam-basics", "network-security", "shared-responsibility-model"],
    relatedTopics: ["monitoring-and-auditing", "pricing-and-billing", "well-architected-framework", "block-file-object-storage", "governance-and-management"],
    keywords: ["organizations", "scp", "shield", "waf", "kms", "inspector", "guardduty", "security hub", "macie", "artifact", "encryption", "ddos", "secrets manager", "acm", "cloudhsm", "cognito", "detective", "firewall manager", "network firewall", "ram", "directory service", "active directory", "security hub cspm", "audit manager", "zero trust", "defense in depth", "cia triad", "hashing", "salt", "fips 140", "hsm", "envelope encryption", "penetration testing", "compliance", "soc 2", "pci dss", "hipaa", "iam identity center", "verified access", "owasp"],
  },

  {
    id: "pricing-and-billing",
    title: "Pricing, Billing and Support",
    level: "advanced",
    description: "How AWS charges, cost tools (Calculator, Budgets, Cost Explorer), consolidated billing, tags, support plans and Marketplace.",
    explanation: md(
      "AWS pricing follows a few rules: **pay for what you use**, **pay less when you reserve** (RIs, Savings Plans), and **pay less as you use more** (tiered pricing, for example S3, and volume discounts). Billing is **metered** (per second or per hour, by service), not a flat monthly fee. A forgotten or oversized resource can run up a big bill fast. Prices also **vary by Region**.",
      "**AWS Free Tier (current model)**: accounts created **after 15 July 2025** choose a **Free plan** or a **Paid plan** at sign-up. They get **USD 100 in credits**, up to **USD 100 more** for finishing getting-started activities, and **30+ always-free services**.",
      "Accounts created before that date keep the **legacy Free Tier**: *always free* allowances, *12 months free* offers (such as limited micro instance hours) and *short-term trials*. Older courses only describe this 12-month model. Turn on Free Tier usage alerts in Billing preferences to get an email as you near the limits.",
      "**Free services, paid resources**: IAM, Amazon VPC, Auto Scaling, CloudFormation, Elastic Beanstalk, Organizations and consolidated billing cost nothing themselves. The resources they create (EC2 instances, load balancers, NAT gateways, Lambda functions) are billed normally.",
      "**Credits** work like dollars on your bill. They come from programs such as **AWS Activate** (startups), events or hackathons. You redeem them in the Billing console. They usually expire and do not cover every charge (for example domain registration).",
      "**Made a costly mistake?** Open a **billing case** in the Support Center; this works even on the free Basic plan. AWS may give a one-time credit but expects you to set up cost alerts afterwards.",
      "**Data transfer costs**",
      "- *Into* AWS from the internet: generally free.\n- *Out* to the internet: charged per GB (with a small free monthly allowance).\n- Between Regions: charged.\n- Between AZs in a Region: charged at a lower rate.\n- Within the same AZ using private IPs: free.\n- Same-AZ placement or CloudFront can cut transfer bills, but spreading across AZs is still right for availability.",
      "**Cost tools**",
      "- **AWS Pricing Calculator** (calculator.aws): estimate an architecture *before* you build it. Free, runs in the browser, **needs no AWS account**. Build an estimate per service, group services, then export it (CSV, PDF, JSON) or share a link. It replaced the retired **TCO Calculator**: for total cost of ownership, compare your known on-premises costs with the Calculator's AWS estimate (Migration Evaluator helps with on-premises data).\n- **Billing and Cost Management dashboard**: your current spend and bills. The **Bills page** breaks charges down by service and Region; it is the quickest way to see exactly what you pay for.\n- **AWS Cost Explorer**: charts past cost and usage (daily or monthly) and forecasts future spend. Filter and group by service, account, Region, tag or instance type, with preset and saved reports. It is also where **Savings Plans and Reserved Instance recommendations, utilisation and coverage** reports live.\n- **AWS Budgets**: cost, usage, Reserved Instance and Savings Plans budgets (daily, monthly, quarterly or annual; daily budgets do not forecast). Alerts fire on **actual or forecasted** amounts at a percentage or fixed threshold, sent to email, Amazon SNS or chat channels. **Budget actions** react automatically, for example by applying an IAM policy or SCP or stopping EC2/RDS instances (they need IAM permissions to act for you). **Budget reports** email a daily, weekly or monthly summary. Basic monitoring is free; some extras cost money.\n- **Billing alarms**: the older approach. Enable billing alerts in Billing preferences, then create a **CloudWatch alarm on the EstimatedCharges metric** (reported in **us-east-1**, in USD) that notifies an SNS topic. They allow flexible CloudWatch alarm logic (static or anomaly-detection thresholds) but do not forecast like Budgets.\n- **Cost and Usage Report (CUR)**: the most detailed billing data. Hourly, daily or monthly line items delivered to S3 as compressed CSV or Parquet, now through **AWS Data Exports (CUR 2.0)**, ready for Athena, Redshift or **Amazon Quick** (formerly QuickSight).\n- **AWS Billing Conductor**: custom billing groups and pro-forma rates, for resellers and for chargeback or showback inside a company.\n- **Price List API**: prices in code. The Query API returns filtered JSON, the Bulk API offers downloadable price files, and you can subscribe to SNS notifications when prices change.",
      "Exam tip: SNS email subscriptions must be confirmed (click the link in the email) before any budget or billing alert reaches you.",
      "**Cost allocation tags** are key-value labels (like `team=checkout`) for grouping costs. There are **user-defined** tags and **AWS-generated** tags (such as `createdBy`). Both must be **activated** in the Billing console before they show up in Cost Explorer and the CUR.",
      "**Consolidated billing** is a free feature of AWS Organizations. The **management account** (formerly the master or payer account) pays one bill for all member accounts, with per-account detail kept. AWS treats the organization as one customer, so combined usage reaches volume tiers sooner and RI/Savings Plans discounts can be shared. Cost Explorer can show usage across linked accounts. A member account that leaves the organization needs its own payment method.",
      "**Savings Plans** commit you to a steady hourly spend for 1 or 3 years. **Compute Savings Plans** apply across EC2, Fargate and Lambda. **EC2 Instance Savings Plans** are tied to one instance family in one Region. **SageMaker AI Savings Plans** cover SageMaker. Cost Explorer recommends a commitment from your past usage.",
      "**Support plans (changed December 2025)**",
      "- **Basic** (free): account and billing help, service quota requests, documentation, re:Post, Health Dashboard and core Trusted Advisor checks.\n- **Business Support+**: the entry paid plan for technical support cases.\n- **Enterprise Support** and **Unified Operations** (the top tier): both include a **designated Technical Account Manager (TAM)**.\n- Paid plans unlock all Trusted Advisor checks and the Support API.\n- **Developer** and the original **Business** plan closed to new subscriptions on 2 December 2025. **Enterprise On-Ramp** is being retired by 1 January 2027. You will still see these names in older study material and exam questions.\n- Check current prices and response times on the AWS Support page; see the Support Plans lesson for details.",
      "**AWS Marketplace** is a curated catalog of third-party software: AMIs, CloudFormation templates, SaaS, containers, WAF rule groups and more. Charges appear on your AWS bill and AWS pays the seller. It is also a sales channel for software vendors and consulting partners, and is built into places like the EC2 launch wizard.",
    ),
    analogy:
      "AWS billing is like a utility bill with extra dashboards. Pricing Calculator is the quote before you move in, Cost Explorer is the monthly usage chart, Budgets is the alarm when you are on track to overspend, tags are room labels showing which room used the most electricity, and a support plan is the repair contract you bought.",
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
        code: `Situation                                         Plan (since Dec 2025)
------------------------------------------------  ---------------------
Learning, billing/account questions only          Basic
Need technical support cases for workloads        Business Support+
Business-critical estate, designated TAM          Enterprise Support
Largest estates, deepest operational help         Unified Operations

Closed to new customers: Developer, Business
Retiring by 1 Jan 2027:  Enterprise On-Ramp`,
        explanation: "Older exam questions may still use the old plan names; know both lineups.",
      },
    ],
    howItWorks: md(
      "Each service meters something: compute time, GB stored, requests, data transferred out. Usage adds up into a monthly bill. With Organizations, a **management account** pays for all **member accounts**, and their usage is pooled to reach volume tiers sooner.",
      "Cost Explorer reads the same usage data and filters it by service, account, Region or tag. Budgets compares it to your thresholds and notifies you by email or SNS.",
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
      "Pay-as-you-go only helps if you can see, predict and control what you pay. Cost tools turn the bill from an end-of-month surprise into a metric engineers can manage.",
    ),
    whenToUse: md(
      "Estimate with the Pricing Calculator before building, set Budgets from day one, tag every resource, review Cost Explorer often, and pick a support plan that matches how critical your workloads are.",
    ),
    whenNotToUse: md(
      "Do not buy Enterprise support for a hobby project. The Calculator gives estimates, not guarantees. Check license terms and per-hour fees before buying Marketplace software.",
    ),
    commonMistakes: [
      "Forgetting to enable cost allocation tags, then finding reports ungrouped.",
      "Ignoring data transfer charges when estimating.",
      "Leaving idle resources (unattached volumes, unused IPs, forgotten instances).",
      "Confusing Budgets (alerts on thresholds) with Cost Explorer (analysis).",
      "Assuming Free Tier lasts forever or covers every service.",
      "Forgetting to activate cost allocation tags, then wondering why they are missing from reports.",
      "Ignoring data transfer out and cross-Region replication in cost estimates.",
      "Creating resources without checking the default size - some services default to large, expensive instance types.",
      "Creating a billing alarm without first enabling billing alerts, or looking for the billing metric outside us-east-1.",
      "Never confirming the SNS email subscription, so alerts silently go nowhere.",
      "Thinking a free service (CloudFormation, Elastic Beanstalk, Auto Scaling) means the resources it launches are free.",
      "Studying the old 12-month Free Tier rules for a new account - accounts created after 15 July 2025 use the credit-based Free and Paid plans.",
      "Recommending the Developer or Business support plan to a new customer - they are closed to new subscriptions; Business Support+ is the entry paid plan.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "State which tool: estimate a new architecture, alert at 80% of spend, analyse last quarter's costs by service." },
      { difficulty: "Medium", prompt: "Define a tagging scheme (team, env, project) and explain how it enables cost reports per team." },
      { difficulty: "Medium", prompt: "Build an estimate for a web app: two instances, a database, storage and 500 GB of data transfer. List which items you might forget." },
      { difficulty: "Hard", prompt: "Your monthly bill doubled. Find the cause with Cost Explorer, tags, CloudTrail and Budgets, then stop it happening again." },
      { difficulty: "Easy", prompt: "Set up a monthly cost budget with an alert at 80% of actual spend and 100% of forecasted spend, delivered to an SNS topic. Remember to confirm the subscription." },
      { difficulty: "Medium", prompt: "Compare a CloudWatch billing alarm with an AWS Budgets alert: where each lives, whether it forecasts, and what each can trigger." },
      { difficulty: "Medium", prompt: "Explain how consolidated billing lets three accounts reach a cheaper S3 pricing tier sooner than they would alone." },
      { difficulty: "Hard", prompt: "Design a cost-reporting pipeline: activate cost allocation tags, export CUR 2.0 to S3, query it with Athena and chart it in Amazon Quick." },
    ],
    interviewQuestions: [
      { question: "What does consolidated billing give you?", answer: "One bill for all accounts in an organization, combined usage for volume discounts, and shared commitment discounts, while keeping per-account visibility." },
      { question: "Name the current AWS Support plans.", answer: "Since December 2025: Basic, Business Support+, Enterprise Support and Unified Operations. Developer and Business are closed to new subscriptions and Enterprise On-Ramp is being retired by 1 January 2027." },
      { question: "Which plans include a designated Technical Account Manager?", answer: "Enterprise Support and Unified Operations. (In the old lineup, Enterprise had a designated TAM and Enterprise On-Ramp a pool of TAMs.)" },
      { question: "Exam-style: Which tool gives Savings Plans purchase recommendations based on past usage?", answer: "AWS Cost Explorer." },
      { question: "Exam-style: Which tool can stop EC2 instances automatically when a spending threshold is crossed?", answer: "AWS Budgets (budget actions)." },
      { question: "Exam-style: Which report provides the most detailed, line-item billing data delivered to S3?", answer: "AWS Cost and Usage Report (CUR 2.0 through AWS Data Exports)." },
      { question: "Exam-style: Which AWS Organizations feature combines bills and shares volume discounts at no extra charge?", answer: "Consolidated billing." },
      { question: "Exam-style: Do you need an AWS account to use the AWS Pricing Calculator?", answer: "No, it is a free browser tool." },
      { question: "Exam-style: Which Savings Plan type applies across EC2, Fargate and Lambda?", answer: "Compute Savings Plans." },
      { question: "Exam-style: Where do you find a third-party firewall AMI and pay for it on your AWS bill?", answer: "AWS Marketplace." },
      { question: "What does a new AWS account (after July 2025) get under the Free Tier?", answer: "A choice of Free plan or Paid plan, USD 100 in credits plus up to USD 100 more for completing activities, and 30+ always-free services." },
      { question: "In which Region does the EstimatedCharges billing metric appear?", answer: "US East (N. Virginia), us-east-1." },
      { question: "Exam-style: Which tool estimates the cost of planned AWS resources? (A) Cost Explorer (B) Budgets (C) Pricing Calculator (D) Trusted Advisor", answer: "C." },
      { question: "Exam-style: Which tool sends alerts when costs exceed a threshold?", answer: "AWS Budgets." },
      { question: "Exam-style: Which AWS service lets you define custom billing groups with custom rates?", answer: "AWS Billing Conductor." },
      { question: "Is data transfer into AWS from the internet charged?", answer: "Generally no; data transfer out to the internet is charged." },
    ],
    prerequisites: ["ec2-pricing", "monitoring-and-auditing"],
    relatedTopics: ["well-architected-framework", "migration-and-innovation", "security-services", "block-file-object-storage", "support-and-partner-resources"],
    keywords: ["billing", "free tier", "cost explorer", "budgets", "pricing calculator", "tags", "consolidated billing", "support plan", "tam", "marketplace", "data transfer", "billing conductor", "cur", "cost allocation tags", "tiered pricing", "business support+", "unified operations", "free plan", "credits", "savings plans", "billing alarm", "estimatedcharges", "budget actions", "data exports", "price list api", "activate", "management account"],
  },

  {
    id: "migration-and-innovation",
    title: "Migration and Innovation",
    level: "advanced",
    description: "CAF perspectives, the 7 Rs of migration, data transfer tools, and AWS AI/ML services.",
    explanation: md(
      "**AWS Cloud Adoption Framework (CAF)** helps organizations plan their move to the cloud through six **perspectives**. The first three cover business capabilities, the last three technical ones:",
      "- **Business**: business and finance managers, budget owners, strategy stakeholders. Makes sure cloud spending speeds up business outcomes.\n- **People**: HR, staffing and people managers. Skills, culture and organisational change.\n- **Governance**: CIO, programme and project managers, enterprise architects, business analysts. Runs initiatives, measures benefits and manages risk.\n- **Platform**: CTO, IT managers, solutions architects. Builds and improves the cloud platform.\n- **Security**: CISO, security managers and analysts. Security, resilience and compliance.\n- **Operations**: IT operations and support managers. Runs cloud services at the agreed health and reliability.",
      "Following the CAF brings more reliable migrations, more business value, lower risk, better business-IT alignment, and clearer skills and roles. AWS Partners and AWS Professional Services help apply it, and a cloud readiness assessment survey shows your gaps.",
      "**The 7 Rs** are strategies for moving each application:",
      "- **Retire**: switch it off; nobody needs it.\n- **Retain**: leave it where it is for now.\n- **Rehost** (lift and shift): move it as is to EC2.\n- **Relocate**: move at the hypervisor level (for example VMware workloads) with little change.\n- **Repurchase**: replace it with a SaaS product.\n- **Replatform** (lift, tinker and shift): small improvements, such as moving to a managed database.\n- **Refactor / re-architect**: redesign it to use cloud-native features.",
      "**Discover, plan and track**",
      "- **AWS Application Discovery Service**: collects server inventory, utilisation and dependencies from on-premises data centers.\n- **Migration Evaluator** (formerly TSO Logic): an agentless collector inventories your on-premises servers and projects their cost on AWS, giving a data-driven business case.\n- **AWS Migration Hub**: one place to track migration progress across tools.\n- **AWS Migration Acceleration Program (MAP)**: methodology, tooling and partner help for large enterprise migrations.",
      "**Moving servers and data**",
      "- **AWS Application Migration Service (MGN)**: replicates servers into AWS for lift-and-shift rehosting.\n- **VM Import/Export**: brings existing VM images (VMware, Hyper-V, Citrix Xen, Azure VHD) into EC2. Upload the image to S3, start the import with the CLI or API, and get an AMI you can launch.\n- **AWS DataSync**: automates online transfers between on-premises storage and AWS storage.\n- **AWS Transfer Family**: moves files over SFTP/FTPS.\n- **AWS Snow Family** (Snowball Edge devices): rugged appliances that physically carry data into or out of AWS (landing in S3) and can run edge compute when networks are slow, costly or missing. **Snowmobile and Snowcone are retired**, and **Snowball Edge closed to new customers on 7 November 2025**. AWS now points new customers to **DataSync** or the **AWS Data Transfer Terminal**. The exam guide still lists the Snow Family, so know what it does.",
      "**Database Migration Service (DMS)**: a **replication instance** copies data from a **source endpoint** to a **target endpoint** while the source database **keeps running**. It works on-premises to AWS, between accounts, between engines, and even from relational to NoSQL.",
      "- Sources include Oracle, SQL Server, MySQL, MariaDB, PostgreSQL, MongoDB, Db2 and Azure SQL.\n- Targets include RDS, Aurora, Redshift, DynamoDB, S3, OpenSearch Service, DocumentDB, Neptune and Kafka.\n- **Homogeneous** migrations (MySQL to MySQL) are simple. **Heterogeneous** ones (Oracle to PostgreSQL, SQL to NoSQL) first need the **AWS Schema Conversion Tool (SCT)** or **DMS Schema Conversion** to convert the schema and code.\n- Not every engine and version pairing is supported, so check each path.",
      "**Licences**",
      "- **Bring your own license (BYOL)**: reuse licences you already own on AWS to save money (for example Microsoft licences through License Mobility with Software Assurance). Exam tip: Windows Server or SQL Server licences tied to **physical cores or sockets** point to **EC2 Dedicated Hosts**. On RDS, BYOL applies to **Oracle**.\n- **AWS License Manager**: tracks licences (by vCPU, core, socket or machine) from vendors such as Microsoft, Oracle, SAP and IBM across AWS and on-premises, to help you stay compliant.",
      "**Why organisations move: innovation waves**. Economists describe long technology cycles (Kondratiev or K-waves): steam, railways and steel, electricity, cars and petrochemicals, information technology. Each has a boom, slowdown, depression and recovery. Cloud is seen as the latest wave. A **burning platform** is when a company drops old technology for new despite the uncertainty, because staying put feels riskier (for example leaving its data center for the cloud as part of digital transformation).",
      "**Innovation with AI/ML**",
      "- **Amazon SageMaker AI** (formerly Amazon SageMaker): build, train and deploy your own machine learning models.\n- **Amazon Bedrock**: foundation models through an API, to build generative AI apps.\n- **Amazon Lex**: conversational chatbots.\n- **Amazon Transcribe**: speech to text.\n- **Amazon Polly**: text to speech.\n- **Amazon Comprehend**: text analysis (sentiment, entities).\n- **Amazon Textract**: extract text and structure from scanned documents.\n- **Amazon Rekognition**: image and video analysis.\n- **Amazon Translate**: language translation.\n- **Amazon Kendra** and similar services: intelligent search.",
    ),
    analogy:
      "Migrating is like moving a large household. Retire is donating the broken lamp, retain is leaving the piano in the old house for now, rehost is moving the sofa as it is, replatform is swapping the heavy fridge for a built-in one, repurchase is a rental subscription instead of buying a washing machine, and refactor is redesigning the kitchen. Snowball is the shipping container you fill when the moving van would take forever.",
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
Train and host my own model                      SageMaker AI
Add generative AI via foundation models          Bedrock
Build a voice or text chatbot                    Lex
Turn call recordings into text                   Transcribe
Pull fields from scanned invoices                Textract
Find sentiment or entities in reviews            Comprehend
Detect objects in photos                         Rekognition`,
      },
    ],
    howItWorks: md(
      "A migration usually runs in phases: discover and assess what you have, plan with the CAF and the 7 Rs, build the landing zone (accounts, network, security), migrate in waves with replication tools, then optimise.",
      "For data, choose between the network (DataSync, VPN or Direct Connect) and physical devices, based on volume and bandwidth. If moving it online would take weeks or months, shipping a device wins.",
      "AI services come in layers: ready-made APIs (Transcribe, Textract), a platform to build your own models (SageMaker AI), and foundation-model access (Bedrock). Pick the highest layer that does the job.",
    ),
    diagram: `  Discover -> Plan (CAF, 7 Rs) -> Build landing zone -> Migrate -> Optimise
                                           |
                       Data: DataSync / network OR Snow device
                       Servers: Application Migration Service
                       Databases: SCT + DMS`,
    whyItExists: md(
      "Moving hundreds of apps without a plan is chaos. Frameworks give business and technical teams shared words, and tools cut downtime and manual errors. AI services let teams add intelligence without hiring a research lab.",
    ),
    whenToUse: md(
      "Use the 7 Rs to sort an application portfolio. Use Snow devices for huge datasets over slow links (existing Snowball Edge customers only; new customers use online options such as DataSync or the Data Transfer Terminal). Use DataSync for recurring online transfers. Try managed AI services before building custom models.",
    ),
    whenNotToUse: md(
      "Do not refactor everything; it is the costliest strategy. Do not ship a device for a small dataset the network can handle. Do not train a custom model when a managed API already does the job.",
    ),
    commonMistakes: [
      "Treating every app as a rehost and getting no cloud benefit.",
      "Skipping the Retire step and migrating applications nobody uses.",
      "Ignoring data gravity: apps move easily, databases and data do not.",
      "Forgetting security and governance in the migration plan.",
      "Mixing up Textract (documents), Transcribe (audio) and Comprehend (text analysis).",
      "Starting a migration without discovery - hidden dependencies cause outages.",
      "Running a heterogeneous database migration (e.g. Oracle to PostgreSQL) with DMS alone and skipping schema conversion with SCT or DMS Schema Conversion.",
      "Assuming the source database must be shut down during DMS migration - it can stay online.",
      "Planning a new data move around Snowmobile, Snowcone or a new Snowball Edge order - those options are retired or closed to new customers.",
      "Choosing shared-tenancy EC2 for Windows/SQL Server BYOL licences that are bound to physical cores - use Dedicated Hosts.",
      "Mixing up the CAF perspectives' owners (e.g. putting the CISO under Governance instead of Security).",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "List the six CAF perspectives and group them into business and technical capabilities." },
      { difficulty: "Medium", prompt: "Assign a Strategy to five applications of your choice and defend each." },
      { difficulty: "Medium", prompt: "Compute how long 200 TB takes over a 1 Gbps link (use the unit converter) and decide whether to ship a device." },
      { difficulty: "Hard", prompt: "Design a Textract plus Comprehend pipeline using S3, Lambda and SQS to process incoming invoices." },
      { difficulty: "Easy", prompt: "For each CAF perspective, name the typical stakeholder role (for example the CISO for Security)." },
      { difficulty: "Medium", prompt: "Plan an Oracle-to-Aurora PostgreSQL migration: which tool converts the schema, which moves the data, and how do you keep downtime low?" },
      { difficulty: "Medium", prompt: "A company has on-premises SQL Server licences tied to physical cores. Recommend how to run them on AWS and which service tracks licence use." },
    ],
    interviewQuestions: [
      { question: "Name the 7 Rs.", answer: "Retire, Retain, Rehost, Relocate, Repurchase, Replatform, Refactor." },
      { question: "CAF perspectives?", answer: "Business, People, Governance, Platform, Security, Operations." },
      { question: "When would you use a Snowball Edge?", answer: "To move large datasets or process data at the edge when network transfer is too slow, expensive or unavailable. Note: Snowball Edge closed to new customers in November 2025, so new designs use DataSync or the AWS Data Transfer Terminal." },
      { question: "Exam-style: Which service lets you build generative AI apps using foundation models through an API?", answer: "Amazon Bedrock." },
      { question: "Exam-style: Which service extracts text and tables from scanned documents?", answer: "Amazon Textract." },
      { question: "Exam-style: Which service collects on-premises server utilisation and dependency data to plan a migration?", answer: "AWS Application Discovery Service." },
      { question: "Exam-style: Which service provides a single dashboard to track migrations?", answer: "AWS Migration Hub." },
      { question: "Exam-style: Which service migrates a database to AWS while the source stays operational?", answer: "AWS Database Migration Service (DMS)." },
      { question: "Exam-style: Which tool converts an Oracle schema so it can run on PostgreSQL?", answer: "AWS Schema Conversion Tool (or DMS Schema Conversion)." },
      { question: "Exam-style: Which service builds a migration business case from an agentless inventory of on-premises servers?", answer: "Migration Evaluator (formerly TSO Logic)." },
      { question: "Exam-style: Which service centrally tracks software licences from Microsoft, Oracle and others?", answer: "AWS License Manager." },
      { question: "Exam-style: Which EC2 option fits BYOL for licences bound to physical sockets or cores?", answer: "EC2 Dedicated Hosts." },
      { question: "Exam-style: Which feature imports existing VMware or Hyper-V images as AMIs?", answer: "VM Import/Export." },
      { question: "Exam-style: Which CAF perspective focuses on skills, culture and organisational change?", answer: "The People perspective." },
      { question: "Exam-style: Which CAF perspective is led by the CTO and solutions architects and focuses on building the cloud platform?", answer: "The Platform perspective." },
      { question: "What is a 'burning platform' in digital transformation?", answer: "A situation where a company abandons old technology for new despite uncertainty, because staying put is seen as the bigger risk." },
    ],
    prerequisites: ["aws-databases", "block-file-object-storage", "vpc-networking"],
    relatedTopics: ["well-architected-framework", "pricing-and-billing", "serverless-and-containers", "security-services", "aws-databases", "ai-ml-services"],
    keywords: ["migration", "caf", "7 rs", "rehost", "replatform", "refactor", "snowball", "datasync", "sagemaker ai", "bedrock", "textract", "transcribe", "application discovery service", "migration hub", "mgn", "transfer family", "migration evaluator", "dms", "schema conversion tool", "sct", "vm import/export", "byol", "license manager", "dedicated hosts", "map", "snow family", "data transfer terminal", "burning platform", "innovation waves"],
  },

  {
    id: "specialised-services",
    title: "Specialised Services: HPC, Quantum, Satellite and Custom Chips",
    level: "advanced",
    description: "High performance computing (ParallelCluster, EFA, placement groups, Batch), Amazon Braket, AWS Ground Station, and AWS-designed chips: Graviton, Inferentia and Trainium.",
    explanation: md(
      "The exam may name these specialised services in a single question: supercomputing, quantum computing, satellites and AWS's own chips. You only need to know what each is for.",
      "**High performance computing (HPC)**",
      "HPC means hundreds or thousands of servers with very fast network links working together on one problem too big or slow for an ordinary computer: weather and fluid simulations, genomics, financial risk models, scientific research and large-scale deep learning.",
      "- **AWS ParallelCluster**: an AWS-supported, open-source tool that builds and manages HPC clusters. Describe the cluster in a config file and run the `pcluster` CLI; behind the scenes it uses **CloudFormation**. A cluster has a **head node** and **compute nodes** that scale between a minimum and maximum. A **job scheduler** queues the work: current versions use **Slurm** or **AWS Batch** (older schedulers such as SGE were removed).\n- **Elastic Fabric Adapter (EFA)**: an EC2 network interface with very low latency and high throughput between instances, which tightly coupled HPC and ML training jobs need.\n- **Cluster placement groups**: EC2 places instances physically close together in one AZ for the lowest latency between them. (Spread placement groups do the opposite: they separate instances to reduce correlated failures.)\n- **AWS Batch**: fully managed batch job scheduling. Submit jobs, and Batch provisions the right compute (EC2, Spot or Fargate) and runs them. Good for many independent jobs, not one tightly linked simulation.\n- **HPC-optimised instances**: compute-optimised families with enhanced networking, and the dedicated **Hpc** instance family.\n- **AWS CloudShell** is a handy place to run `pcluster`: a browser shell in the console with the AWS CLI preinstalled and your console credentials.",
      "**Amazon Braket**: a managed **quantum computing** service for research and experiments. It gives access to quantum hardware from several **third-party providers**, plus **simulators** and managed notebooks, so you can try quantum algorithms without owning a quantum computer. You pay per task and per **shot** (one run of a quantum circuit), at rates that depend on the device.",
      "**AWS Ground Station**: a fully managed service to **communicate with satellites** and process their data without building your own antennas. Schedule a **contact** (which satellite, start and end time, which ground station location). Then uplink and downlink with EC2 instances launched from a Ground Station AMI, or send downlinked data straight to S3. Uses: weather forecasting, earth imaging, communications and video broadcasting.",
      "**AWS-designed chips**",
      "- **AWS Graviton**: Arm-based general-purpose processors for EC2 (and many managed services). Usually better price-performance and less energy than similar x86 instances: a Sustainability and Cost Optimization win.\n- **AWS Inferentia**: an accelerator for low-cost **machine learning inference** (running trained models). It replaces the discontinued Amazon Elastic Inference.\n- **AWS Trainium**: an accelerator for **training** machine learning models.\nExam trap: Inferentia and Trainium are ML accelerators, not GPUs. GPU instances on AWS use NVIDIA or AMD chips.",
    ),
    analogy:
      "Think of AWS as a city. Most people use ordinary shops and buses (EC2, S3). This lesson covers the specialist sites: the supercomputer centre with its own fast internal roads (HPC with EFA and placement groups), the physics lab you book by the hour (Braket), the satellite dish farm you rent instead of building (Ground Station), and the city's own factory making engines tuned for its buses (Graviton, Inferentia, Trainium).",
    examples: [
      {
        title: "Create an HPC cluster with ParallelCluster",
        language: "bash",
        code: `# Install the CLI (or use CloudShell), then:
pcluster configure --config cluster.yaml   # interactive wizard
pcluster create-cluster \\
  --cluster-name cfd-sim \\
  --cluster-configuration cluster.yaml
pcluster describe-cluster --cluster-name cfd-sim

# On the head node, submit work to Slurm:
sbatch run-simulation.sh
# Delete the cluster when finished to stop charges
pcluster delete-cluster --cluster-name cfd-sim`,
        explanation: "ParallelCluster turns the YAML file into a CloudFormation stack with a head node, a Slurm scheduler and auto-scaling compute nodes.",
      },
      {
        title: "Which specialised service?",
        language: "text",
        code: `Need                                        Service
------------------------------------------  ------------------
Build and manage an HPC cluster             ParallelCluster
Low-latency networking between instances    EFA
Put instances physically close together     Cluster placement
Run thousands of independent batch jobs     AWS Batch
Experiment with quantum algorithms          Amazon Braket
Download data from a satellite              Ground Station
Cheaper, efficient general-purpose CPU      Graviton
Low-cost ML inference                       Inferentia
Train large ML models                       Trainium`,
      },
    ],
    howItWorks: md(
      "**HPC on AWS**: ParallelCluster reads your config, creates a CloudFormation stack, launches a head node and registers compute queues with the scheduler. When jobs arrive, compute nodes scale out (often in a cluster placement group with EFA for fast node-to-node traffic). They scale back in when the queue empties, so you pay only while jobs run. Shared storage such as Amazon FSx for Lustre or EFS is often attached.",
      "**Braket**: write a quantum circuit (for example with the Braket SDK in a managed notebook), choose a simulator or a provider's quantum device, and submit a task. Results land in S3.",
      "**Ground Station**: onboard your satellite and reserve a contact at an antenna location. During the pass, AWS streams the radio data to your EC2 instances or S3. No antennas or data center of your own.",
      "**Custom chips**: you pick them through instance types: Graviton-based families, Inf (Inferentia) and Trn (Trainium) instances. Adopting them mostly means choosing the right instance and recompiling or using a supported framework.",
    ),
    diagram: `  HPC cluster (ParallelCluster)
  +-----------+     Slurm / Batch
  | Head node |---> job queue
  +-----------+         |
        |               v
  +-----------------------------------+
  | Compute nodes (scale min..max)    |
  | cluster placement group + EFA     |
  +-----------------------------------+
        |
   Shared storage (FSx for Lustre/EFS)

  Satellite --radio--> Ground Station --> EC2 / S3
  Quantum circuit --> Braket --> device/simulator --> S3`,
    whyItExists: md(
      "Supercomputers, quantum hardware and satellite antennas are very expensive and slow to build. Renting them on demand lets you run occasional large jobs, try new technology, or use satellite data without a capital investment. AWS-designed chips give better price-performance and lower energy use than off-the-shelf processors for common workloads.",
    ),
    whenToUse: md(
      "- ParallelCluster with EFA and cluster placement groups: tightly coupled simulations.\n- AWS Batch: lots of independent jobs.\n- Braket: learning and prototyping quantum algorithms.\n- Ground Station: when you operate or rent satellite capacity.\n- Graviton: most general-purpose workloads that run on Arm.\n- Inferentia: cost-efficient inference. Trainium: training at scale.",
    ),
    whenNotToUse: md(
      "Do not build an HPC cluster for a simple web app or a job one large instance can handle. Do not expect Braket to speed up production work today; quantum computing is still experimental. Check that your software supports Arm before moving to Graviton. Skip Inferentia or Trainium if your framework or model is not supported; GPU instances may be simpler.",
    ),
    commonMistakes: [
      "Calling Inferentia or Trainium GPUs - they are purpose-built ML accelerators (inference and training respectively).",
      "Mixing up Inferentia (inference) and Trainium (training).",
      "Using a spread placement group when the goal is the lowest latency - that needs a cluster placement group.",
      "Leaving an HPC cluster's head node running after the work is done.",
      "Thinking Braket is AWS's own quantum computer - it gives access to third-party quantum hardware plus simulators.",
      "Assuming Ground Station requires you to build antennas - AWS provides and operates them.",
      "Following old ParallelCluster tutorials that use the SGE scheduler - current versions use Slurm or AWS Batch.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Match each to its job: ParallelCluster, EFA, Braket, Ground Station, Graviton, Inferentia, Trainium." },
      { difficulty: "Medium", prompt: "Explain when you would choose AWS Batch over ParallelCluster, with one example workload for each." },
      { difficulty: "Medium", prompt: "Use the AWS Pricing Calculator to compare a Graviton-based instance with a similar x86 instance and note the difference." },
      { difficulty: "Hard", prompt: "Design an HPC environment for a weather simulation: cluster tool, scheduler, networking, placement, storage, and how you keep cost low when idle." },
    ],
    interviewQuestions: [
      { question: "Exam-style: Which service provides access to quantum computers and simulators?", answer: "Amazon Braket." },
      { question: "Exam-style: Which service lets you control satellites and process their data without building ground antennas?", answer: "AWS Ground Station." },
      { question: "Exam-style: Which open-source AWS-supported tool deploys and manages HPC clusters?", answer: "AWS ParallelCluster." },
      { question: "Exam-style: Which EC2 network interface gives low-latency, high-throughput communication for tightly coupled HPC jobs?", answer: "Elastic Fabric Adapter (EFA)." },
      { question: "Exam-style: Which placement group strategy packs instances close together for the lowest network latency?", answer: "Cluster placement group." },
      { question: "Exam-style: Which AWS-designed chip is built for low-cost machine learning inference?", answer: "AWS Inferentia." },
      { question: "Exam-style: Which AWS-designed chip is built for training ML models?", answer: "AWS Trainium." },
      { question: "Exam-style: Which Arm-based AWS processor offers better price-performance for general workloads?", answer: "AWS Graviton." },
      { question: "What is a 'shot' in Amazon Braket?", answer: "One execution of a quantum circuit; tasks are made of many shots and pricing is per task and per shot." },
      { question: "What does ParallelCluster use to build its infrastructure?", answer: "AWS CloudFormation, driven by the pcluster CLI and a cluster configuration file." },
    ],
    prerequisites: ["ec2-basics", "auto-scaling-and-load-balancing"],
    relatedTopics: ["ec2-pricing", "ai-ml-services", "serverless-and-containers", "block-file-object-storage", "well-architected-framework"],
    keywords: ["hpc", "high performance computing", "parallelcluster", "pcluster", "slurm", "aws batch", "efa", "elastic fabric adapter", "placement group", "braket", "quantum computing", "ground station", "satellite", "graviton", "arm", "inferentia", "trainium", "cloudshell"],
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
      "**Architecture qualities to tell apart** (a favourite exam topic):",
      "- **High availability**: the service stays up - remove single points of failure and keep performance steady; on AWS, run across **multiple AZs**.\n- **Scalability**: the system *can* grow to handle more load.\n- **Elasticity**: it grows *and shrinks* **automatically** with demand (Auto Scaling).\n- **Fault tolerance**: it keeps working even while a component fails.\n- **Disaster recovery**: it can be restored after a major failure.\nAlways also ask how secure and how expensive a design is.",
      "**General design principles** (apply across all pillars): stop guessing your capacity needs; test systems at production scale; automate to make architectural experiments cheap (infrastructure as code); allow for evolutionary architectures (CI/CD); drive architectures using data; improve through **game days** (practice failure events).",
      "**More pillar principles worth knowing**: Operational Excellence also says *refine operations procedures frequently* and *anticipate failure* (pre-mortems, game days). Security adds *keep people away from data* (automate access instead of manual handling) and *no long-lived credentials*. Reliability's *scale horizontally* means many small resources instead of one big one, so no single failure takes everything down. Performance Efficiency's *mechanical sympathy* means matching the technology to how the data is accessed. Cost Optimization's *analyse and attribute expenditure* means tagging costs to the workload owners.",
      "**How the framework is organised**: each pillar has its own whitepaper with **design principles**, **definitions**, **best practices** and resources. The Cloud Practitioner exam focuses on the **design principles** at a surface level. Useful vocabulary: a **component** is code, configuration and AWS resources; a **workload** is a set of components that delivers business value; **milestones** mark key architecture changes over time; the **technology portfolio** is all the workloads a business runs.",
      "**AWS's way of working**: rather than a central architecture team, AWS prefers distributed teams that own their workloads, supported by **practices** (experts who raise the bar), **mechanisms** (automated standards checks) and the Amazon Leadership Principles.",
      "**Running a review with the Well-Architected Tool**: it is **free**. You define a workload (environment such as production or pre-production, Regions) and pick one or more **lenses** - the core Well-Architected Framework lens, or specialised ones such as **Serverless**, **SaaS** or the **Foundational Technical Review (FTR)** lens. You then answer questions such as OPS 1 \"How do you determine what your priorities are?\", each with inline help. The tool flags **high and medium risks** and produces a report you can share with stakeholders.",
      "**AWS Architecture Center**: a portal of reference architectures and best practices, many with diagrams and deployable code (CloudFormation or CDK), to turn Well-Architected guidance into concrete designs.",
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
      "Using 'scalable' and 'elastic' as synonyms - elasticity means scaling out *and back in* automatically.",
      "Confusing fault tolerance (keeps running through a failure) with disaster recovery (restores after one).",
      "Thinking the Well-Architected Tool is a paid audit - it is a free self-service questionnaire.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Name all six pillars and give one design principle for each." },
      { difficulty: "Medium", prompt: "Take a simple architecture (single EC2 + RDS) and list risks by pillar." },
      { difficulty: "Medium", prompt: "Show how adding multi-AZ affects reliability, cost and operational complexity." },
      { difficulty: "Hard", prompt: "Choose between two designs (serverless vs EC2 fleet) using all six pillars and justify a recommendation." },
      { difficulty: "Easy", prompt: "Define high availability, scalability, elasticity, fault tolerance and disaster recovery in one sentence each." },
      { difficulty: "Medium", prompt: "Create a workload in the Well-Architected Tool, choose the Serverless lens, answer the first operational excellence questions and read the risks it flags." },
    ],
    interviewQuestions: [
      { question: "What are the six pillars?", answer: "Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization and Sustainability." },
      { question: "What does the Reliability pillar emphasise?", answer: "Recovering automatically from failures, testing recovery, scaling horizontally, and managing change." },
      { question: "What is the Well-Architected Tool?", answer: "A console service that helps you review workloads against the pillars and track improvements." },
      { question: "Exam-style: A company deploys across multiple AZs. Which pillar does this primarily support?", answer: "Reliability." },
      { question: "Exam-style: Which pillar covers using managed services and maximising utilisation to reduce environmental impact?", answer: "Sustainability." },
      { question: "Exam-style: 'Perform operations as code' is a design principle of which pillar?", answer: "Operational Excellence." },
      { question: "Exam-style: 'Democratize advanced technologies' and 'go global in minutes' belong to which pillar?", answer: "Performance Efficiency." },
      { question: "Exam-style: 'Stop spending money on undifferentiated heavy lifting' belongs to which pillar?", answer: "Cost Optimization." },
      { question: "Exam-style: 'Keep people away from data' and 'enable traceability' belong to which pillar?", answer: "Security." },
      { question: "Exam-style: A system automatically adds and removes instances as demand changes. Which quality is this?", answer: "Elasticity." },
      { question: "Exam-style: Which AWS resource offers reference architectures with deployable code?", answer: "The AWS Architecture Center." },
      { question: "What is a lens in the Well-Architected Tool?", answer: "An extra set of questions and best practices for a specific technology or industry, such as Serverless or SaaS." },
      { question: "What is a game day?", answer: "A planned exercise that simulates failures or events in production-like conditions to test people, processes and systems." },
    ],
    prerequisites: ["aws-global-infrastructure", "auto-scaling-and-load-balancing", "security-services"],
    relatedTopics: ["pricing-and-billing", "monitoring-and-auditing", "migration-and-innovation", "scalability", "cloud-practitioner-exam", "disaster-recovery"],
    keywords: ["well-architected", "pillars", "reliability", "operational excellence", "sustainability", "performance efficiency", "cost optimization", "multi-az", "design principles", "well-architected tool", "lens", "high availability", "elasticity", "fault tolerance", "game day", "architecture center", "mechanical sympathy"],
  },

  {
    id: "support-and-partner-resources",
    title: "Support Plans and Partner Resources",
    level: "advanced",
    description: "Current support plans (Dec 2025 lineup), Trusted Advisor, Support Center, re:Post, Knowledge Center, Partner Network, Marketplace, Professional Services, Solutions Architects, AMS and Activate.",
    explanation: md(
      "AWS offers paid support plans and many free and paid resources to help you learn, solve problems and find expert partners.",
      "**Support plans (restructured in December 2025)**. Every plan includes 24/7 customer service, documentation, whitepapers, AWS re:Post, the **AWS Health Dashboard** (free for everyone) and the core Trusted Advisor checks. The current lineup:",
      "- **Basic**: free. Account and billing questions, **service quota (limit) increase requests**, and billing cases (for example asking for help after an accidental bill). No technical support cases.\n- **Business Support+**: the entry paid plan. Adds **technical support cases**, the **full set of Trusted Advisor checks** and the **AWS Support API**.\n- **Enterprise Support**: for business-critical workloads; includes a **designated Technical Account Manager (TAM)** and proactive guidance.\n- **Unified Operations**: the top tier for the largest, most critical estates; also includes a **designated TAM** and the deepest operational help.\nPrices and response-time targets change, so check the AWS Support page rather than memorising figures.",
      "**The older lineup you will still see**: Basic, **Developer** (business-hours email help), **Business** (24/7 phone, chat and email with Cloud Support Engineers), **Enterprise On-Ramp** (a *pool* of TAMs) and **Enterprise** (a *designated* TAM, the fastest response for business-critical outages). **Developer and Business closed to new subscriptions on 2 December 2025**, and **Enterprise On-Ramp is being retired by 1 January 2027**. Existing customers may still be on them, and exam questions written earlier may use these names, so learn both - but recommend the current plans for anything new.",
      "**How paid support works in practice**: cases are opened in the Support Center by web, chat or phone callback (depending on plan), and keep a full history; engineers may offer screen sharing. Have your **account ID** and the **ARNs** of affected resources ready. Each case has a **severity** - from general guidance up through system impaired, production system impaired, production system down and business-critical system down - and higher plans get faster targets for the severe ones. Changing your plan is done in the Support Plans console; it is **no longer a root-only task** (the root user or an IAM user with the right permissions can do it). Paid plans have a minimum charge, so upgrading for a few days and downgrading does not refund that minimum.",
      "**A TAM's job**: a Technical Account Manager is your named AWS contact who gives proactive guidance (architecture and operational reviews, cost-reduction ideas, launch and event planning, workshops) and helps during incidents.",
      "**AWS Trusted Advisor**: continuously checks your account against best practices in six categories - **cost optimization, performance, security, fault tolerance, service limits (service quotas) and operational excellence** - with some one-click fixes and optional weekly emails. Examples: idle load balancers or unassociated Elastic IPs (cost), highly used EC2 instances (performance), MFA on the root user (security), RDS backups turned off (fault tolerance), VPC or EC2 quotas near their limit (service limits). Basic customers get the **service-limit checks plus core security checks** (such as open S3 bucket permissions, security groups with unrestricted ports, IAM use, root MFA, public EBS and RDS snapshots); **the full set needs a paid plan**.",
      "**AWS Documentation** (docs.aws.amazon.com) is organised per service into user guides, developer guides and API references, and much exam content comes straight from it.",
      "**Where to get help**",
      "- **AWS Support Center**: open and manage cases.\n- **AWS re:Post**: community Q&A, the successor to the AWS forums.\n- **AWS Knowledge Center**: answers to frequently asked support questions.\n- **AWS Prescriptive Guidance**: strategies, guides and patterns for migration and modernization.\n- **AWS Trust & Safety**: report abuse coming *from* AWS resources - spam, port scanning, DoS attacks, intrusion attempts, malware, or prohibited or copyrighted content - using the Report Amazon AWS abuse form or abuse@amazonaws.com, not a support case.\n- **Documentation, whitepapers, blogs, Well-Architected resources and AWS Skill Builder** for self-paced training.",
      "**Partners and professional help**",
      "- **AWS Partner Network (APN)**: companies that build on or resell AWS. **Independent software vendors (ISVs)** offer software on AWS; **systems integrators (SIs)** and consulting partners design and implement solutions. Partners move up tiers (**Select, Advanced, Premier**) based on certified staff, customer success and fees, and can earn **competencies** that signal expertise. Benefits include training, co-marketing, co-selling and promotional credits; APN membership is also needed to sponsor AWS events.\n- **AWS Marketplace**: digital catalog of third-party software, data and services. Features: pay-as-you-go or subscription pricing, charges on your AWS bill, free trials, private offers, and quick deployment (AMIs, SaaS, containers).\n- **AWS Professional Services**: AWS consultants who help deliver specific outcomes. **Solutions Architects** give free architecture guidance. **AWS IQ** (a marketplace for freelance AWS experts) was discontinued on May 28, 2026; AWS now points customers to **Professional Services listings in AWS Marketplace** and AWS Partners instead. Older study material may still mention IQ. **AWS Managed Services (AMS)** operates your AWS infrastructure for you. **AWS Activate** gives startups credits, training and support.",
    ),
    analogy:
      "Support plans are like roadside-assistance memberships: Basic is the free number for billing questions, Business Support+ gets a mechanic on the phone for real breakdowns, and Enterprise Support or Unified Operations give you your own named mechanic who knows your fleet. Partners are the garages and dealers, Marketplace is the accessory shop, and Professional Services is a consultant who comes to your driveway.",
    examples: [
      {
        title: "Which plan fits? (current lineup)",
        language: "text",
        code: `Situation                                   Plan
------------------------------------------  ------------------
Learning; billing or quota questions only   Basic
Need technical cases, full Trusted Advisor  Business Support+
Business-critical, want a designated TAM    Enterprise Support
Largest estates, deepest operational help   Unified Operations

Old names: Developer, Business (closed to new
customers Dec 2025), Enterprise On-Ramp
(retiring by 1 Jan 2027), Enterprise.`,
        explanation: "Match urgency and operational criticality: the higher the stakes, the faster the response and the more proactive the help.",
      },
      {
        title: "Open a support case from the CLI",
        language: "bash",
        code: `# The Support API needs a paid support plan
aws support create-case \\
  --subject "Production RDS failover question" \\
  --service-code amazon-rds --severity-code high \\
  --communication-body "Describe what happened and when." \\
  --language en`,
        explanation: "The Support API (and the full Trusted Advisor check set) requires a paid plan; on Basic this call is rejected.",
      },
    ],
    howItWorks: md(
      "Support plans differ in **who answers** (support engineers vs a designated TAM), **how fast** (response targets by case severity), **what is included** (technical cases, full Trusted Advisor checks, the Support API, proactive reviews), and **price** (a monthly minimum or a share of your AWS usage). You can upgrade when you need help and downgrade later, but the minimum charge for the period is not refunded.",
      "Partners join the APN through requirements such as training and validated customer success. Marketplace sellers publish listings; buyers subscribe, and AWS bills the charges alongside regular AWS usage.",
    ),
    diagram: `  Self-service (free)
    re:Post, Knowledge Center, docs, Skill Builder,
    Prescriptive Guidance, Health Dashboard
  Support plans (paid help)
    Basic < Business Support+ < Enterprise Support (TAM)
          < Unified Operations (TAM)
  Experts
    Partners (ISV, SI), Professional Services,
    Solutions Architects, AMS, Marketplace`,
    whyItExists: md(
      "Cloud adoption needs guidance. Some customers want only documentation; others need engineers on call or a partner to design a whole migration. A tiered offering lets each pay for the level of help that matches their risk.",
    ),
    whenToUse: md(
      "Choose a support plan based on production criticality. Use re:Post and Knowledge Center first for common questions, Partners or Professional Services for large projects, Marketplace to buy ready-made software or hire expert services, AMS when you want AWS to operate your environment, and Activate when you are a startup.",
    ),
    whenNotToUse: md(
      "Do not run business-critical production on Basic expecting engineer help - Basic has no technical cases. Do not sign new customers up for Developer, Business or Enterprise On-Ramp; they are closed or retiring. Do not rely on Trust & Safety for account or billing problems - that is Support or Customer Service.",
    ),
    commonMistakes: [
      "Believing Basic includes technical support cases (it covers billing, account and service quota requests).",
      "Confusing a TAM (Enterprise Support or Unified Operations) with an AWS Solutions Architect (free pre-sales guidance).",
      "Treating AWS Marketplace as free software - you pay the vendor's price through AWS billing.",
      "Reporting abuse through a support case instead of the Trust & Safety team.",
      "Forgetting that plan features and response times can change; check current AWS documentation.",
      "Still quoting the five-plan lineup (Basic, Developer, Business, Enterprise On-Ramp, Enterprise) as current - since December 2025 it is Basic, Business Support+, Enterprise Support and Unified Operations.",
      "Thinking only the root user can change the support plan - IAM users with the right permissions can too.",
      "Believing the AWS Health Dashboard needs a paid plan - it is free for everyone.",
      "Expecting every Trusted Advisor check on Basic - only service limits and core security checks are included.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Order the four current support plans from least to most support and name one feature that appears at each step. Then map each old plan name to where it stands today." },
      { difficulty: "Easy", prompt: "Name the six Trusted Advisor categories and one example check for each." },
      { difficulty: "Medium", prompt: "A startup runs a production app and has one engineer on call. Recommend a plan and justify it." },
      { difficulty: "Medium", prompt: "List four benefits of buying software through AWS Marketplace." },
      { difficulty: "Hard", prompt: "A company is migrating hundreds of servers. Describe which partner and AWS resources you would use at each phase." },
    ],
    interviewQuestions: [
      { question: "Exam-style: Which support plan first provides a designated Technical Account Manager?", answer: "Enterprise Support (Unified Operations also has one). In the older lineup, Enterprise had a designated TAM and Enterprise On-Ramp a pool of TAMs." },
      { question: "Exam-style: Which is the lowest-cost current plan that allows technical support cases?", answer: "Business Support+. (In the older lineup, Developer allowed business-hours technical cases and Business was the cheapest with 24/7 engineer access.)" },
      { question: "What are the current AWS Support plans?", answer: "Basic, Business Support+, Enterprise Support and Unified Operations (since December 2025)." },
      { question: "Exam-style: A Basic plan customer wants a service quota increase. Do they need to upgrade?", answer: "No. Basic covers account and billing questions and service quota increase requests." },
      { question: "Exam-style: Which Trusted Advisor checks are available without a paid plan?", answer: "The service-limit checks and the core security checks; the full set requires a paid plan." },
      { question: "Exam-style: Name the Trusted Advisor categories.", answer: "Cost optimization, performance, security, fault tolerance, service limits (service quotas) and operational excellence." },
      { question: "Exam-style: Is changing the support plan a root-user-only task?", answer: "No. The root user or an IAM user with the right Support Plans permissions can change it." },
      { question: "Exam-style: Which service shows events affecting your AWS resources, free for every account?", answer: "The AWS Health Dashboard." },
      { question: "What are the AWS Partner Network tiers?", answer: "Select, Advanced and Premier." },
      { question: "Exam-style: Where do you report an AWS resource being used to send spam?", answer: "AWS Trust & Safety." },
      { question: "Exam-style: Which resource is a community-driven Q&A site for AWS questions?", answer: "AWS re:Post." },
      { question: "Exam-style: Which AWS service lets you find and buy third-party software with charges on your AWS bill?", answer: "AWS Marketplace." },
      { question: "Exam-style: Which offering operates a customer's AWS infrastructure for them?", answer: "AWS Managed Services (AMS)." },
      { question: "Exam-style: Which program helps startups with credits and training?", answer: "AWS Activate." },
      { question: "What does an ISV do versus an SI in the AWS Partner Network?", answer: "An ISV builds software products that run on AWS; a systems integrator designs and implements solutions for customers." },
    ],
    prerequisites: ["pricing-and-billing"],
    relatedTopics: ["pricing-and-billing", "governance-and-management", "migration-and-innovation", "cloud-practitioner-exam"],
    keywords: ["support plans", "business support+", "unified operations", "developer support", "business support", "enterprise on-ramp", "enterprise support", "tam", "trusted advisor", "health dashboard", "support api", "case severity", "documentation", "support center", "re:post", "knowledge center", "prescriptive guidance", "trust and safety", "apn", "isv", "marketplace", "professional services", "solutions architect", "aws iq", "ams", "activate"],
  },

  {
    id: "cloud-practitioner-exam",
    title: "AWS Cloud Practitioner Exam (CLF-C02)",
    level: "advanced",
    description: "Exam format and domains, a study plan, question strategies, a task-statement map, look-alike names, and a 27-question practice set.",
    explanation: md(
      "The **AWS Certified Cloud Practitioner** exam (code **CLF-C02**) validates foundational cloud knowledge. It is meant for people from technical and non-technical roles alike, and no prior AWS experience is required.",
      "**Format**: 65 questions in 90 minutes: **50 are scored and 15 are unscored** items AWS uses to evaluate future questions, and you cannot tell which is which, so answer every question. Question types are **multiple choice** (one correct answer out of four options) and **multiple response** (two or more correct answers out of five or more options). There is **no penalty for guessing**: an unanswered question counts as incorrect, so never leave one blank.",
      "**Scoring**: the exam is pass/fail. Results are reported as a **scaled score from 100 to 1,000** and the **minimum passing score is 700**. Scoring is **compensatory**: you pass by your overall score, not by passing each domain, so a weak area can be offset by strength elsewhere.",
      "**Version and audience**: **CLF-C02 replaced CLF-C01 on 19 September 2023** and added a new task statement on the AWS Cloud Adoption Framework (CAF). The target candidate has up to **6 months of exposure to AWS Cloud** in any role, and people from non-IT backgrounds (sales, finance, management, project roles) are welcome. **Out of scope**: coding, designing cloud architecture, troubleshooting, implementation, and load or performance testing.",
      "**Domains and weights**",
      "- **Cloud Concepts**: 24%\n- **Security and Compliance**: 30%\n- **Cloud Technology and Services**: 34%\n- **Billing, Pricing, and Support**: 12%",
      "**Task-statement map** (official exam guide numbering to the lessons that cover it):",
      "- **1.1** Benefits of the AWS Cloud: what-is-cloud-computing\n- **1.2** Design principles: well-architected-framework\n- **1.3** Migration benefits and strategies (including CAF): migration-and-innovation\n- **1.4** Cloud economics: what-is-cloud-computing, ec2-pricing, pricing-and-billing\n- **2.1** Shared responsibility model: shared-responsibility-model\n- **2.2** Security, governance and compliance concepts: security-services, monitoring-and-auditing, governance-and-management\n- **2.3** Access management: iam-basics\n- **2.4** Security components and resources: security-services, network-security\n- **3.1** Deploying and operating methods: interacting-with-aws, developer-and-end-user-tools, governance-and-management\n- **3.2** Global infrastructure: aws-global-infrastructure\n- **3.3** Compute: ec2-basics, auto-scaling-and-load-balancing, serverless-and-containers\n- **3.4** Databases: aws-databases\n- **3.5** Networking: vpc-networking, network-security, dns-and-cdn\n- **3.6** Storage: block-file-object-storage\n- **3.7** AI/ML and analytics: ai-ml-services, migration-and-innovation, analytics-services\n- **3.8** Other in-scope services (integration, end-user, developer, IoT): application-integration, messaging-sqs-sns, developer-and-end-user-tools\n- **4.1** Pricing models: ec2-pricing, pricing-and-billing\n- **4.2** Billing, budget and cost management: pricing-and-billing\n- **4.3** Technical resources and support options: support-and-partner-resources, monitoring-and-auditing",
      "Check the official exam guide before booking: details, languages and fees can change, and the AWS site is the authority.",
      "**Booking and logistics**: exams are delivered by **Pearson VUE**, either at a **test center** or **online with a remote proctor**. Online exams need a quiet, clear room - interruptions can end your attempt - so many people prefer a test center. Plan for more seat time than the 90 minutes: instructions, the proctor's workspace check, the NDA and an end-of-exam survey add to it. The certification is **valid for three years**. A new exam code (C01 to C02) signals a major refresh, so make sure your study material matches **CLF-C02**.",
      "**Where it fits**: Cloud Practitioner is the broad, foundational \"bird's-eye view\" of AWS - good for newcomers, sales and management roles, and engineers refreshing the basics - but it does not prove you can build workloads. **AWS Certified AI Practitioner** is the other foundational certification. The usual next step is **Solutions Architect - Associate**, then the other associate exams such as Developer or CloudOps Engineer.",
      "**Initialisms to know**: IAM, S3, EC2, EBS, EFS, ECS, ECR, EKS, EMR, ELB (ALB, NLB, GWLB, CLB), ASG (Auto Scaling group), RDS, VPC, VPN, SNS, SQS, SES, SWF (Simple Workflow Service), SSM (Systems Manager), CFN (CloudFormation), EB (Elastic Beanstalk), WAF, ACM (Certificate Manager), RAM (Resource Access Manager), MSK (Managed Streaming for Apache Kafka), MQ (Amazon MQ), TAM, RI (Reserved Instance), PoLP (principle of least privilege), IoT.",
      "**Look-alike names the exam loves**",
      "- **AWS Config** (records resource configurations and checks compliance) vs **AWS AppConfig** (rolls out application settings and feature flags).\n- **AWS Direct Connect** (private network link to AWS) vs **Amazon Connect** (cloud contact center).\n- **AWS Artifact** (AWS compliance reports) vs **AWS CodeArtifact** (software package repository).\n- **Amazon Inspector** (vulnerabilities in your workloads) vs **AWS Trusted Advisor** (account-wide best-practice checks).\n- **AWS Artifact** (trust in AWS) vs **Amazon Inspector** (security of your own workloads).",
      "**Outdated material warning**: older courses still teach the Developer/Business/Enterprise On-Ramp support plans (restructured December 2025), the 12-month-only Free Tier (new accounts since July 2025 get credit-based Free or Paid plans), five Well-Architected pillars (there are six) and services that are retired or closed to new customers (CodeCommit, Cloud9, Snowmobile, Snowcone, new Snowball Edge orders). Learn the current state, but recognise the old names in questions.",
      "**Study plan** (adapt to your time):",
      "- Week 1: Cloud concepts, global infrastructure, shared responsibility, IAM.\n- Week 2: Compute, storage, databases, networking.\n- Week 3: Security services, monitoring, pricing, support, Well-Architected, migration.\n- Week 4: Hands-on in a free account, then timed practice sets, then review your weak areas.\nExperienced engineers may need only a few focused sessions; complete beginners should allow several weeks mixing lectures, hands-on labs and practice exams. Aim for practice scores comfortably above the pass mark (around 85%) before booking, to leave a safety margin.",
    ),
    analogy:
      "Preparing for the exam is like learning a new city before a visit. You do not need the name of every alley; you need the map (domains), the main landmarks (core services), the transport rules (pricing and support), and a feel for the neighbourhood from actually walking around (hands-on labs).",
    examples: [
      {
        title: "Study path by exam weight (with course timestamps)",
        language: "text",
        code: `For people revisiting AWS. New to AWS? Study everything, in order.
Timestamps: Andrew Brown's CLF-C02 course (freeCodeCamp, 2026).

SECURITY AND COMPLIANCE - 30%
  4:01:33-4:20:29   Shared Responsibility   -> shared-responsibility-model
  8:01:00-8:46:02   IAM, least privilege,   -> iam-basics
                    root user, MFA
  12:43:03-13:31:24 Encryption, KMS vs      -> security-services
                    CloudHSM, Shield, WAF,
                    GuardDuty, Inspector
  13:31:24-13:41:55 Look-alike services     -> exam traps in this lesson

BILLING, PRICING AND SUPPORT - 12%
  7:42:00-8:01:00   EC2 pricing models      -> ec2-pricing
  11:47:58-12:43:03 Billing, Support plans, -> pricing-and-billing,
                    Cost Explorer, Budgets,    support-and-partner-
                    Trusted Advisor            resources (new plans!)

CLOUD TECHNOLOGY AND SERVICES - 34%
  8:46:02-9:03:02   SQS, SNS, EventBridge   -> messaging-sqs-sns,
                                               application-integration
  5:12:18-5:52:46   Storage (S3 classes)    -> block-file-object-storage
  5:52:46-6:28:32   RDS/DynamoDB/Redshift   -> aws-databases
  6:50:21-7:42:00   EC2 basics              -> ec2-basics,
                                               auto-scaling-and-load-
                                               balancing
  9:03:02-9:13:54   ECS, EKS, Fargate       -> serverless-and-containers

CLOUD CONCEPTS - 24%
  1:23:23-1:26:55   Advantages of cloud     -> what-is-cloud-computing
                    (AWS lists SIX)
  2:12:13-2:35:33   HA, fault tolerance,    -> what-is-cloud-computing,
                    elasticity, RTO/RPO        disaster-recovery
  11:12:40-11:34:23 Well-Architected        -> well-architected-framework

SKIM, DON'T SKIP
  1:26:55-2:12:13   Global infrastructure   -> aws-global-infrastructure
                    (Regions, AZs, edge, Local Zones, Wavelength
                     are common exam questions)
  10:31:09-11:12:40 AI/ML and big data      -> ai-ml-services,
                    (recognise the names)      analytics-services
OK TO SKIP IF SHORT ON TIME
  0:44:25-1:14:09   Account setup demo
  Any "follow along" console or CLI demo`,
        explanation:
          "Time follows the weights: Security and Technology are almost two thirds of the exam. The video predates some changes, so trust the lessons here where they differ: Support plans changed in December 2025, and KMS now uses FIPS 140-3 Level 3 hardware. Finish with timed mock tests in Exam practice.",
      },
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
Move big data physically          Snow Family (legacy)`,
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
      "Use the 27-question practice set below (in the interview questions) as a timed quiz: answer each before opening it.",
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
      "Thinking the pass mark is '70%' - it is a scaled score of 700 out of 1,000.",
      "Leaving hard questions blank - there is no penalty for guessing, and a hard question may be unscored anyway.",
      "Mixing up look-alike names: Config vs AppConfig, Direct Connect vs Amazon Connect, Artifact vs CodeArtifact.",
      "Booking an online exam in a room where you might be interrupted.",
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
      { question: "Practice 15: Which support plan first includes a designated Technical Account Manager?", answer: "Enterprise Support (Unified Operations also includes one). In the older lineup, Enterprise On-Ramp had a pool of TAMs." },

      { question: "Practice 16: Which service provides a dedicated private network connection from a data center to AWS?", answer: "AWS Direct Connect." },
      { question: "Practice 17: Which service runs SQL queries on data in S3 without servers?", answer: "Amazon Athena." },
      { question: "Practice 18: A company wants to cut idle cost by choosing smaller instance types after reviewing usage. What is this called?", answer: "Rightsizing (AWS Compute Optimizer can recommend it)." },
      { question: "Practice 19: Which service enables single sign-on across multiple AWS accounts for workforce users?", answer: "AWS IAM Identity Center." },
      { question: "Practice 20: Which service records configuration changes and evaluates compliance against rules?", answer: "AWS Config." },
      { question: "Practice 21: Which AWS Support resource is a community Q&A site?", answer: "AWS re:Post." },
      { question: "Practice 22: Which design principle is described by 'treat servers as disposable and automate everything'?", answer: "Automation and loosely coupled design (a Well-Architected design principle)." },
      { question: "Practice 23: Which feature lets you set a spending threshold and be alerted?", answer: "AWS Budgets." },
      { question: "Practice 24: Which service provides managed SFTP endpoints into Amazon S3?", answer: "AWS Transfer Family." },
      { question: "Practice 25: Which CAF perspective covers identity, compliance and data protection?", answer: "The Security perspective." },
      { question: "Practice 26: A company wants a private, dedicated network link to AWS. Direct Connect or Amazon Connect?", answer: "AWS Direct Connect. Amazon Connect is a contact-center service." },
      { question: "Practice 27: Which service deploys feature flags and application settings safely: AWS Config or AWS AppConfig?", answer: "AWS AppConfig. AWS Config tracks resource configurations and compliance." },
      { question: "Is there a penalty for wrong answers on CLF-C02?", answer: "No. Unanswered questions are marked wrong, so always pick an answer." },
      { question: "How long is the Cloud Practitioner certification valid, and who delivers the exam?", answer: "Three years; the exam is delivered by Pearson VUE at a test center or online with a proctor." },
      { question: "Can you tell which 15 questions are unscored?", answer: "No. They are not identified, so treat every question as if it counts." },
    ],
    prerequisites: ["well-architected-framework", "pricing-and-billing"],
    relatedTopics: ["what-is-cloud-computing", "shared-responsibility-model", "iam-basics", "security-services", "migration-and-innovation", "support-and-partner-resources", "ai-ml-services"],
    keywords: ["clf-c02", "cloud practitioner", "certification", "exam", "study plan", "practice questions", "domains", "pearson vue", "scaled score", "unscored questions", "ai practitioner", "recertification", "initialisms"],
  },
];
