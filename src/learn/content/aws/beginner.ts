import type { Topic } from "../../types/content";
import { md } from "./md";

export const awsBeginnerTopics: Topic[] = [
  {
    id: "what-is-cloud-computing",
    title: "What is Cloud Computing?",
    level: "beginner",
    description: "Renting computing resources over the internet, on demand, and paying only for what you use.",
    explanation: md(
      "**Cloud computing** means using someone else's data centers - servers, storage, networking, databases - through the internet, instead of buying and running your own hardware. You ask for what you need, you get it in minutes, and you are billed for what you actually consumed.",
      "Almost everything on the web follows the **client-server model**: a *client* (your browser or phone app) sends a request, and a *server* (a computer somewhere) sends back a response. Cloud providers like AWS run enormous fleets of those servers and let you rent slices of them.",
      "Three ideas define the cloud:",
      "- **On-demand self-service**: you provision resources yourself through a console or API, with no purchase order and no waiting for a delivery truck.\n- **Pay-as-you-go**: no large upfront purchase; the meter runs only while you use something.\n- **Elasticity**: you can grow or shrink capacity as demand changes.",
      "**Deployment models** describe where the infrastructure lives:",
      "- **Cloud**: everything runs on a cloud provider. You can build there from scratch or migrate existing apps.\n- **On-premises** (also called a *private cloud* when it offers self-service on your own hardware): everything runs in your own data center.\n- **Hybrid**: a mix. Some workloads stay in your data center (for latency, regulation, or because they are hard to move) while others run in the cloud, connected by a network link.",
      "AWS commonly lists **six advantages of cloud computing**:",
      "- Trade upfront (capital) expense for variable expense.\n- Benefit from massive economies of scale.\n- Stop guessing capacity.\n- Increase speed and agility.\n- Stop spending money running and maintaining data centers.\n- Go global in minutes.",
    ),
    analogy:
      "Owning your own servers is like buying a truck to move apartments once a year: you pay for it, insure it, park it, and it sits idle most of the time. The cloud is like a van-rental app - you tap, a van shows up, and you pay for the hours you drove. Need a bigger vehicle for a week? Tap again.",
    examples: [
      {
        title: "On-premises vs cloud: the same need, two ways",
        language: "text",
        code: `Need: a web server for a product launch next month

On-premises:
  1. Forecast peak traffic (guess)
  2. Order hardware, wait weeks for delivery
  3. Rack it, cable it, install the OS
  4. Pay for it whether or not anyone visits
  5. After launch it sits mostly idle

Cloud:
  1. Launch a server (an EC2 instance) in minutes
  2. Add more during the launch spike
  3. Remove them afterwards
  4. Pay only for the hours they ran`,
        explanation: "The work is the same; the difference is when you pay and how fast you can change your mind.",
      },
      {
        title: "Your first cloud request, from the terminal",
        language: "bash",
        code: `# Ask AWS which account and identity you are using
aws sts get-caller-identity

# List the Regions your account can use
aws ec2 describe-regions --query "Regions[].RegionName" --output text`,
        explanation: "Every cloud action is just a request to an API. This is the smallest useful one: 'who am I?'",
      },
    ],
    howItWorks: md(
      "A cloud provider builds huge data centers and uses **virtualization** to slice physical machines into many isolated virtual ones, so thousands of customers can safely share the same hardware (*multi-tenancy*). Software on top exposes every resource as an API call: create a server, attach storage, open a network port.",
      "Because the provider buys hardware at enormous volume, its cost per unit falls - that is the *economy of scale* behind lower prices. And because capacity is pooled, you can scale up for a spike and release it when finished, so you stop guessing capacity months ahead.",
      "Hybrid setups usually connect the two worlds with a VPN or a dedicated network line, so your on-premises systems and cloud systems can talk as though they were on one network.",
    ),
    diagram: `   CLIENT                          CLOUD PROVIDER
 +---------+   request    +-----------------------------+
 | browser |------------->|  Region                     |
 | / app   |<-------------|   +-------+  +-----------+  |
 +---------+   response   |   |server |  | database  |  |
                          |   +-------+  +-----------+  |
   You rent these ------->|   (virtualized, pooled)     |
   and pay by usage       +-----------------------------+`,
    whyItExists: md(
      "Running your own data centers means big upfront spending, long lead times, and capacity that is either too small at peak or too large the rest of the year. Small teams could not afford infrastructure that large companies took for granted.",
      "Cloud computing turns infrastructure into a utility, like electricity: you do not build a power plant to run a lamp. That lets a two-person team experiment cheaply and a large company expand to a new continent without building anything.",
    ),
    whenToUse: md(
      "Choose the cloud when demand is uncertain or spiky, when you want to launch quickly, when you need to reach users in many countries, or when you would rather spend engineering time on your product than on racking servers.",
      "Choose **hybrid** when regulation, latency to local equipment, or a large existing investment keeps some workloads on-premises.",
    ),
    whenNotToUse: md(
      "A steady, predictable, very large workload on fully depreciated hardware may be cheaper to keep on-premises. Strict data-residency rules or equipment that must sit next to a factory floor may also force on-premises or hybrid. The cloud is a tool, not a moral position - compare real costs.",
    ),
    commonMistakes: [
      "Thinking 'cloud' means 'someone else handles all security' - you still own your data, identities, and configuration (see the shared responsibility model).",
      "Assuming the cloud is always cheaper; unused resources left running still cost money.",
      "Confusing a *private cloud* with plain on-premises servers; a private cloud adds self-service and elasticity.",
      "Forgetting that on-demand cuts both ways: resources you forget to turn off keep billing.",
      "Treating hybrid as a temporary failure rather than a legitimate long-term design.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "List the six advantages of cloud computing from memory, and give a one-line example of each." },
      { difficulty: "Easy", prompt: "A news site gets 50x traffic during elections and little otherwise. Explain which cloud benefits apply and why on-premises would struggle." },
      { difficulty: "Medium", prompt: "A bank must keep customer records in its own data center for regulatory reasons but wants to run analytics in the cloud. Sketch a hybrid design and name what connects the two sides." },
      { difficulty: "Medium", prompt: "Run `aws sts get-caller-identity` (or read its output in the docs) and explain each field it returns." },
      { difficulty: "Hard", prompt: "Build a rough 3-year cost comparison for a workload that needs 20 servers year-round vs one that needs 20 servers for two months a year. Where does the cloud win and where might it not?" },
    ],
    interviewQuestions: [
      { question: "What is cloud computing?", answer: "On-demand delivery of IT resources over the internet with pay-as-you-go pricing, instead of owning and running physical infrastructure yourself." },
      { question: "Name the three cloud deployment models.", answer: "Cloud (all in the provider), on-premises (all in your own data center, sometimes called private cloud), and hybrid (a connected mix of both)." },
      { question: "What does 'trade upfront expense for variable expense' mean?", answer: "Instead of buying hardware (capital expense) before you know demand, you pay per use as an operating expense, so cost tracks actual consumption." },
      { question: "Exam-style: A company wants to stop guessing how much server capacity it will need. Which cloud benefit addresses this? (A) Economies of scale (B) Stop guessing capacity (C) Go global in minutes (D) Stop running data centers", answer: "B. You can scale up or down as demand changes instead of forecasting months ahead." },
      { question: "Exam-style: Which model keeps some workloads in a company data center and others in AWS, connected together?", answer: "Hybrid deployment." },
    ],
    prerequisites: [],
    relatedTopics: ["aws-global-infrastructure", "shared-responsibility-model", "ec2-basics", "scalability"],
    keywords: ["cloud", "iaas", "paas", "saas", "on-demand", "pay as you go", "hybrid", "economies of scale", "elasticity", "client server"],
  },

  {
    id: "aws-global-infrastructure",
    title: "AWS Global Infrastructure",
    level: "beginner",
    description: "Regions, Availability Zones, edge locations, and how to pick where your workload runs.",
    explanation: md(
      "AWS runs its services from physical locations spread around the world. Knowing the vocabulary is the first step to building something that is fast, legal, and survives failures.",
      "- **Region**: a separate geographic area (for example `us-east-1` or `eu-west-1`) made up of multiple data center clusters. Regions are isolated from one another; your data stays in a Region unless you move it.\n- **Availability Zone (AZ)**: one or more discrete data centers inside a Region, with independent power, cooling, and networking, connected to the other AZs by fast, low-latency links. Region names plus a letter identify them, like `us-east-1a`.\n- **Edge location**: a site used by services such as CloudFront (CDN) and Route 53 to deliver content closer to end users. There are many more edge locations than Regions.\n- **Local Zones**: small extensions of a Region placed near large cities for single-digit-millisecond latency.\n- **Outposts**: AWS-managed hardware installed in *your* data center, giving you AWS APIs on-premises.",
      "**Choosing a Region** comes down to four factors, usually considered in this order:",
      "- **Compliance**: laws or policies about where data may live come first and are not negotiable.\n- **Latency**: choose a Region near most of your users.\n- **Service availability**: not every service or feature launches in every Region at once.\n- **Pricing**: the same service costs different amounts in different Regions.",
    ),
    analogy:
      "Think of a worldwide delivery company. A Region is a whole city's logistics network. An Availability Zone is one warehouse district within that city, with its own power and roads, so a blackout in one district does not stop the others. Edge locations are neighborhood pickup lockers that hold popular parcels close to customers.",
    examples: [
      {
        title: "Exploring Regions and AZs with the CLI",
        language: "bash",
        code: `# All Regions enabled for your account
aws ec2 describe-regions --query "Regions[].RegionName" --output text

# AZs in one Region
aws ec2 describe-availability-zones \\
  --region eu-west-1 \\
  --query "AvailabilityZones[].[ZoneName,State]" \\
  --output table

# Make a Region your default for this profile
aws configure set region eu-west-1`,
        explanation: "Most CLI calls are Region-scoped. Forgetting which Region you are in is a classic source of 'where did my server go?'",
      },
      {
        title: "Region-choice worksheet",
        language: "text",
        code: `Workload: customer portal for German retail customers

1. Compliance : customer data must stay in the EU        -> EU Regions only
2. Latency    : users are in Germany                     -> eu-central-1 (Frankfurt)
3. Services   : needs a service launched there?          -> verify in the docs
4. Price      : compare with eu-west-1 if latency is OK  -> decide`,
      },
    ],
    howItWorks: md(
      "Each Region contains at least three AZs in most cases, placed far enough apart to avoid sharing a single disaster (flood, fire) but close enough for synchronous replication. When you launch a resource you pick a Region, and for many resources an AZ (or a subnet that lives in one AZ).",
      "Designing for high availability means spreading copies of your workload across **multiple AZs**. Designing for disaster recovery or global users may mean using **multiple Regions**. Edge locations are separate: they cache and accelerate rather than run your servers.",
      "Some services are *global* (IAM, Route 53, CloudFront configuration) while most are *Regional*. Data does not leave a Region unless you configure replication or copy it.",
    ),
    diagram: `                AWS Global Infrastructure
 +------------------------ Region (eu-west-1) -------------------+
 |  +-- AZ a --+   +-- AZ b --+   +-- AZ c --+                    |
 |  |  data    |   |  data    |   |  data    |   <- low-latency   |
 |  |  centers |===|  centers |===|  centers |      private links |
 |  +----------+   +----------+   +----------+                    |
 +--------------------------------------------------------------- +
        ^                                   ^
        |                                   |
  [Local Zone]                       [Edge locations]
  near a big city                    cache content near users
        |
  [Outposts] = AWS hardware in your own data center`,
    whyItExists: md(
      "A single data center is a single point of failure, and a single country is a long way from users elsewhere. Splitting capacity into isolated Regions and AZs lets you survive failures, meet data-residency laws, and keep latency low.",
    ),
    whenToUse: md(
      "Use multiple AZs for almost any production workload that must stay up. Use multiple Regions when you need disaster recovery from a Region-wide event, very low latency for users on different continents, or a legal requirement for separate geographies. Use Local Zones or Outposts when milliseconds matter or data must stay on your premises.",
    ),
    whenNotToUse: md(
      "Do not go multi-Region by default - it adds cost, data-replication complexity, and operational burden. For most apps, multi-AZ in one Region is the right first step. Do not pick a Region just because it is the console default.",
    ),
    commonMistakes: [
      "Choosing a Region only by price, ignoring compliance and latency.",
      "Putting everything in one AZ and calling it 'highly available'.",
      "Confusing an edge location with an AZ - edge locations do not host your EC2 instances.",
      "Looking for a resource in the console and not seeing it because the Region selector is set differently.",
      "Assuming AZ names (like `us-east-1a`) map to the same physical data center for every account; they are mapped per account.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "In your own words, explain the difference between a Region, an Availability Zone, and an edge location." },
      { difficulty: "Easy", prompt: "List the four factors for choosing a Region and rank them for an app that stores health records for Canadian patients." },
      { difficulty: "Medium", prompt: "Run the `describe-availability-zones` command above for two Regions. How many AZs does each have?" },
      { difficulty: "Hard", prompt: "Design (on paper) a deployment that survives the loss of one AZ and then extend it to survive the loss of a whole Region. List what extra cost and complexity each step adds." },
    ],
    interviewQuestions: [
      { question: "What is an Availability Zone?", answer: "One or more discrete data centers in a Region with independent power, cooling, and networking, linked to other AZs in the Region by low-latency connections." },
      { question: "How do you choose a Region?", answer: "Compliance and data residency first, then latency to users, then which services are available there, then price." },
      { question: "What is the difference between an edge location and a Region?", answer: "Regions host your workloads; edge locations are used by services like CloudFront and Route 53 to cache and deliver content close to end users." },
      { question: "Exam-style: A company needs to keep data in a specific country by law. What should it consider first? (A) Price (B) Compliance and data residency (C) Latency (D) Number of edge locations", answer: "B. Legal requirements outrank all other Region-selection factors." },
      { question: "Exam-style: Which AWS offering places AWS-managed infrastructure inside a customer's own data center?", answer: "AWS Outposts." },
    ],
    prerequisites: ["what-is-cloud-computing"],
    relatedTopics: ["ec2-basics", "dns-and-cdn", "vpc-networking", "well-architected-framework", "cdn", "scalability"],
    keywords: ["region", "availability zone", "az", "edge location", "local zones", "outposts", "latency", "data residency", "high availability"],
  },

  {
    id: "interacting-with-aws",
    title: "Interacting with AWS",
    level: "beginner",
    description: "Everything is an API call: the Console, CLI, SDKs, and infrastructure as code with CloudFormation.",
    explanation: md(
      "Every action in AWS - launching a server, creating a bucket, changing a permission - is an **API request** (an authenticated HTTPS call). The different ways to use AWS are just different front ends to those same APIs.",
      "- **AWS Management Console**: the browser interface. Great for learning, exploring, and one-off checks.\n- **AWS CLI**: a command-line tool for scripting and quick automation.\n- **SDKs**: libraries for languages such as JavaScript, Python, Java, and Go, for calling AWS from your application code.\n- **Infrastructure as code (IaC)**: describe resources in a file and let a tool create them. **AWS CloudFormation** does this with JSON or YAML *templates*; a template becomes a **stack** you can create, update, and delete as one unit.",
      "Two higher-level options help when you would rather not manage everything: **AWS Elastic Beanstalk** takes your application code and provisions and manages the environment (servers, load balancing, scaling) for you, while you keep control of the underlying resources. The **AWS CDK** lets you write IaC in a general-purpose programming language that synthesizes to CloudFormation.",
    ),
    analogy:
      "A restaurant has one kitchen but several ways to order: speak to a waiter (Console), fill in a paper slip (CLI), or let an app place the order for you (SDK). Infrastructure as code is handing the kitchen a *written recipe for the entire banquet* so you get the same banquet every time.",
    examples: [
      {
        title: "The same action, three ways",
        language: "bash",
        code: `# 1) Console: click S3 -> Create bucket.
# 2) CLI:
aws s3 mb s3://zykit-demo-bucket-12345 --region eu-west-1

# 3) Raw API under the hood (the CLI signs and sends this for you):
#    PUT https://zykit-demo-bucket-12345.s3.eu-west-1.amazonaws.com/
#    Authorization: AWS4-HMAC-SHA256 ...`,
        explanation: "Bucket names are globally unique, so change the number. All three paths end at the same API.",
      },
      {
        title: "A CloudFormation template (YAML)",
        language: "yaml",
        code: `AWSTemplateFormatVersion: "2010-09-09"
Description: A versioned, private S3 bucket
Parameters:
  BucketName:
    Type: String
Resources:
  AppBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref BucketName
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
Outputs:
  BucketArn:
    Value: !GetAtt AppBucket.Arn`,
        explanation: "Declare the end state; CloudFormation works out the steps. Deleting the stack removes the bucket (if empty).",
        walkthrough: [
          { code: "Parameters:", explanation: "Inputs you pass at deploy time, so one template can serve many environments." },
          { code: "Resources:", explanation: "The things to create. Each has a logical name, a Type, and Properties." },
          { code: "!Ref BucketName", explanation: "A built-in function that substitutes the parameter value." },
          { code: "Outputs:", explanation: "Values reported after deploy, handy for other stacks or scripts." },
        ],
      },
      {
        title: "Deploying the stack",
        language: "bash",
        code: `aws cloudformation deploy \\
  --template-file bucket.yaml \\
  --stack-name demo-bucket \\
  --parameter-overrides BucketName=zykit-demo-bucket-12345

aws cloudformation describe-stacks --stack-name demo-bucket \\
  --query "Stacks[0].Outputs"

aws cloudformation delete-stack --stack-name demo-bucket`,
      },
    ],
    howItWorks: md(
      "Each request carries credentials and is cryptographically signed. AWS checks identity and permissions, then performs the action in the target Region. The Console, CLI, and SDKs all do this signing for you.",
      "With CloudFormation, you submit a template; the service builds a dependency graph, creates resources in a safe order, and tracks them as a stack. A **change set** previews what an update would modify before you apply it. If creation fails, the stack rolls back so you are not left half-built.",
    ),
    diagram: `  Console --+
  CLI ------+--> signed HTTPS request --> AWS API --> resource created
  SDK ------+                                  ^
                                               |
  CloudFormation template --> stack ----------+
  (YAML/JSON, version-controlled)`,
    whyItExists: md(
      "Clicking through a console does not scale and cannot be reviewed, repeated, or rolled back. Scripted and declarative interfaces make environments reproducible, auditable in version control, and fast to rebuild after mistakes or disasters.",
    ),
    whenToUse: md(
      "Use the Console to learn and inspect. Use the CLI for quick automation. Use SDKs when your app must call AWS. Use CloudFormation (or CDK) for anything you will need again - staging and production environments, team-shared infrastructure. Use Elastic Beanstalk when you want to deploy a web app quickly without designing the infrastructure yourself.",
    ),
    whenNotToUse: md(
      "Do not build production infrastructure only by hand in the Console - nobody can reproduce it later. Do not use Elastic Beanstalk when you need fine-grained control over every component; compose the services directly instead.",
    ),
    commonMistakes: [
      "Changing resources by hand that a CloudFormation stack manages, causing drift between the template and reality.",
      "Committing access keys to a Git repository; prefer roles and short-lived credentials.",
      "Running CLI commands against the wrong profile or Region.",
      "Putting secrets in plain-text template parameters.",
      "Skipping change sets and being surprised when an update replaces a resource (and its data).",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Create an S3 bucket with the CLI, list it, then delete it. Note which Region it landed in." },
      { difficulty: "Medium", prompt: "Extend the YAML template to add a lifecycle rule. Validate it with `aws cloudformation validate-template`." },
      { difficulty: "Medium", prompt: "Convert the example template to JSON using the YAML/JSON converter tool and compare the readability." },
      { difficulty: "Hard", prompt: "Explain how you would detect and fix configuration drift on a stack. What would you do if a teammate edited a resource manually?" },
    ],
    interviewQuestions: [
      { question: "What do the Console, CLI, and SDKs have in common?", answer: "All of them send authenticated, signed requests to the same underlying AWS APIs." },
      { question: "What is infrastructure as code and why use it?", answer: "Describing infrastructure in files that tools create automatically. It makes environments repeatable, reviewable, version-controlled, and quick to rebuild." },
      { question: "What is a CloudFormation stack?", answer: "The set of resources created from a template, managed together as a single unit for create, update, and delete." },
      { question: "Exam-style: Which service helps a developer deploy a web application without manually provisioning servers and load balancers, while still being able to access the underlying resources?", answer: "AWS Elastic Beanstalk." },
      { question: "Exam-style: Which service provisions AWS resources from a JSON or YAML template?", answer: "AWS CloudFormation." },
    ],
    prerequisites: ["what-is-cloud-computing"],
    relatedTopics: ["iam-basics", "aws-global-infrastructure", "serverless-and-containers", "monitoring-and-auditing"],
    keywords: ["console", "cli", "sdk", "api", "cloudformation", "iac", "infrastructure as code", "elastic beanstalk", "cdk", "template", "stack"],
  },

  {
    id: "ec2-basics",
    title: "Amazon EC2 Basics",
    level: "beginner",
    description: "Virtual servers in the cloud: instances, AMIs, instance types, and how the hypervisor shares hardware.",
    explanation: md(
      "**Amazon EC2** (Elastic Compute Cloud) rents you virtual servers called **instances**. You choose the operating system, the size, and the network placement; you manage everything from the OS upward.",
      "- **AMI** (Amazon Machine Image): a template containing an operating system and optionally software. Launching an instance means 'start a server from this image'.\n- **Instance type**: the hardware shape, written like `m7g.large` - family and generation (`m7g`) plus size (`large`).\n- **Key pair / Systems Manager**: ways to log in securely.\n- **User data**: a script that runs on first boot to configure the server.",
      "**Instance families** group types by what they are good at:",
      "- **General purpose** (M, T): balanced CPU/memory, the usual starting point. T types are burstable.\n- **Compute optimized** (C): batch processing, game servers, high-performance web.\n- **Memory optimized** (R, X): in-memory databases and large caches.\n- **Storage optimized** (I, D): high local disk throughput, data warehouses.\n- **Accelerated computing** (P, G, Inf, Trn): GPUs and ML chips for training, inference, graphics.",
      "Many instances run on the same physical host - this is **multi-tenancy**. A **hypervisor** (AWS uses the Nitro system) divides the host's CPU, memory, and storage and keeps each tenant isolated.",
    ),
    analogy:
      "A physical server is a large apartment building. The hypervisor is the building manager who divides it into separate flats with locked doors: each tenant gets their own space and cannot peek into the neighbor's. An AMI is the furnished floor plan you can copy into any new flat.",
    examples: [
      {
        title: "Launch an instance",
        language: "bash",
        code: `aws ec2 run-instances \\
  --image-id ami-0123456789abcdef0 \\
  --instance-type t3.micro \\
  --count 1 \\
  --key-name my-key \\
  --security-group-ids sg-0abc1234 \\
  --subnet-id subnet-0abc1234 \\
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=web-1}]'

aws ec2 describe-instances \\
  --filters Name=tag:Name,Values=web-1 \\
  --query "Reservations[].Instances[].[InstanceId,State.Name]" --output table

aws ec2 terminate-instances --instance-ids i-0123456789abcdef0`,
        explanation: "Replace the placeholder IDs with ones from your account. Terminate when done so billing stops.",
      },
      {
        title: "User data bootstrap script",
        language: "bash",
        code: `#!/bin/bash
dnf install -y nginx
echo "hello from $(hostname)" > /usr/share/nginx/html/index.html
systemctl enable --now nginx`,
        explanation: "Runs once at first boot, so a fresh instance configures itself.",
      },
    ],
    howItWorks: md(
      "When you launch, EC2 picks a physical host in the AZ that fits the instance type, attaches a root volume built from the AMI, and starts the VM. Instances go through states: *pending*, *running*, *stopping/stopped*, and *terminated*. You pay for compute while running; stopped instances stop compute billing, but attached EBS volumes still cost money.",
      "Storage can be an **EBS** network volume (persists independently) or an **instance store** (physically attached, lost when the instance stops or terminates). Networking is placed inside a VPC subnet and filtered by security groups.",
    ),
    diagram: `   AMI (OS + software)
        |
        v  launch
 +--------------- Physical host (one AZ) ---------------+
 |   Hypervisor (Nitro)                                  |
 |   +-----------+  +-----------+  +-----------+         |
 |   | Instance A|  | Instance B|  | Instance C|  <-- separate customers
 |   +-----------+  +-----------+  +-----------+         |
 +-------------------------------------------------------+`,
    whyItExists: md(
      "Plenty of software expects a normal server: a particular OS, installed packages, long-running processes. EC2 gives you that control with the speed and billing model of the cloud, which is useful when you cannot or do not want to rewrite for more managed services.",
    ),
    whenToUse: md(
      "Use EC2 for lifted-and-shifted applications, software needing OS-level control, custom networking or licensing, long-running servers, and specialized hardware like GPUs.",
    ),
    whenNotToUse: md(
      "If you only need to run short event-driven code, Lambda is simpler. If you run containers, ECS/EKS with Fargate removes server management. If a managed database fits, use RDS rather than running a database yourself on EC2.",
    ),
    commonMistakes: [
      "Leaving instances running after experiments.",
      "Opening SSH to the entire internet rather than restricting the source.",
      "Storing important data on instance store volumes.",
      "Oversizing 'just in case' instead of right-sizing from metrics.",
      "Treating servers as pets that cannot be rebuilt; bake an AMI or use user data so you can replace them.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Decode the instance type `c7g.xlarge`: what do the letter, number, extra letter and size tell you?" },
      { difficulty: "Easy", prompt: "Pick an instance family for (a) a large in-memory cache, (b) video encoding, (c) a small blog." },
      { difficulty: "Medium", prompt: "Write user data that installs a web server and serves a page showing the instance's hostname." },
      { difficulty: "Hard", prompt: "Explain what is lost, kept, and billed when you stop vs terminate an instance with one EBS root volume and one instance-store volume." },
    ],
    interviewQuestions: [
      { question: "What is an AMI?", answer: "A template with an operating system and optional software used to launch EC2 instances." },
      { question: "What does multi-tenancy mean for EC2?", answer: "Multiple customers' instances share one physical host, kept isolated by the hypervisor." },
      { question: "Which instance family suits memory-intensive workloads?", answer: "Memory optimized (R and X families)." },
      { question: "Exam-style: A company needs full control of the OS for a legacy application. Which compute service fits best?", answer: "Amazon EC2." },
      { question: "Exam-style: Who is responsible for patching the operating system on an EC2 instance?", answer: "The customer; AWS manages the underlying host and hypervisor." },
    ],
    prerequisites: ["what-is-cloud-computing", "aws-global-infrastructure"],
    relatedTopics: ["ec2-pricing", "shared-responsibility-model", "auto-scaling-and-load-balancing", "block-file-object-storage", "scalability"],
    keywords: ["ec2", "instance", "ami", "instance type", "hypervisor", "nitro", "user data", "multi-tenancy", "virtual machine"],
  },

  {
    id: "ec2-pricing",
    title: "EC2 Pricing Options",
    level: "beginner",
    description: "On-Demand, Savings Plans, Reserved Instances, Spot, Dedicated Hosts and Capacity Reservations - and when each fits.",
    explanation: md(
      "The same instance can be bought several ways. You trade **commitment and flexibility** for **price**.",
      "- **On-Demand**: pay per second (or hour, depending on OS) with no commitment. Highest unit price, maximum flexibility. Ideal for unpredictable or short-term workloads.\n- **Savings Plans**: commit to a consistent amount of usage (measured in dollars per hour) for one or three years in exchange for lower rates. Compute Savings Plans are the most flexible, applying across instance families, Regions, and even Fargate and Lambda; EC2 Instance Savings Plans give deeper discounts for a chosen family in a Region.\n- **Reserved Instances (RIs)**: an older billing discount tied to specific instance attributes for one or three years, with Standard and Convertible flavors. Often used for steady-state databases and servers.\n- **Spot Instances**: spare capacity at a steep discount, but AWS can reclaim it with a short warning. Perfect for fault-tolerant, interruptible work.\n- **Dedicated Hosts**: a whole physical server for you, useful for per-socket or per-core licensing and compliance. **Dedicated Instances** run on hardware dedicated to you but with less visibility into the host.\n- **Capacity Reservations**: reserve capacity in a specific AZ for any duration, without a billing discount by themselves (combine with Savings Plans).",
      "Payment options for commitments typically include all upfront, partial upfront, and no upfront; paying more earlier gives a bigger discount.",
    ),
    analogy:
      "Think of a gym. Dropping in each time costs the most but needs no promise (On-Demand). A one- or three-year membership is cheaper per visit if you really go (Savings Plans/RIs). Off-peak standby slots are nearly free but the trainer may ask you to leave (Spot). A private studio only you can enter is the Dedicated Host.",
    examples: [
      {
        title: "Choosing a model",
        language: "text",
        code: `Workload                                   Best fit
-----------------------------------------  -----------------------------
Dev server used a few hours, then deleted  On-Demand
Always-on production API for 3 years       Savings Plan / Reserved
Nightly image-processing jobs, retry-safe  Spot
Database licensed per physical core        Dedicated Host
Must have capacity in one AZ for an event  Capacity Reservation
Unknown, changing compute mix              Compute Savings Plan`,
      },
      {
        title: "Requesting Spot capacity",
        language: "bash",
        code: `aws ec2 run-instances \\
  --image-id ami-0123456789abcdef0 \\
  --instance-type c6i.large \\
  --instance-market-options 'MarketType=spot,SpotOptions={SpotInstanceType=one-time}'

# Inspect recent Spot price history
aws ec2 describe-spot-price-history \\
  --instance-types c6i.large \\
  --product-descriptions "Linux/UNIX" --max-items 3`,
        explanation: "Spot suits work that can checkpoint and restart. Do not run a single critical server on it.",
      },
    ],
    howItWorks: md(
      "AWS bills each running instance by its usage. Commitment discounts (Savings Plans, RIs) are applied automatically to matching usage on your bill; you do not 'assign' them to a particular server. Spot capacity is auctioned from spare pools; when AWS needs the capacity back it sends a two-minute interruption notice before reclaiming it.",
      "A sensible strategy mixes models: commit to your steady baseline, use On-Demand for the unpredictable layer on top, and use Spot for flexible background work.",
    ),
    diagram: `  Usage over time
  |            ____ On-Demand (spikes)
  |       ____|    |____
  |  ____|              |____    Spot (batch work)
  | [==== Savings Plan / Reserved baseline ====]
  +---------------------------------------------> time`,
    whyItExists: md(
      "AWS has spare capacity at some moments and needs predictable revenue at others. Discounts reward customers who give predictability, while On-Demand keeps the door open for those who cannot. It lets different workloads pay fairly for what they need.",
    ),
    whenToUse: md(
      "Commit after you have watched real usage for a while and know your baseline. Use Spot for stateless, interruptible, or batch jobs. Use Dedicated Hosts when licenses or regulations require physical server visibility.",
    ),
    whenNotToUse: md(
      "Do not buy a three-year commitment for a project that may be cancelled. Do not run databases or single-instance critical services on Spot. Do not choose Dedicated Hosts without a licensing or compliance reason - they are expensive.",
    ),
    commonMistakes: [
      "Committing before understanding actual usage, then paying for idle commitments.",
      "Running stateful services on Spot without handling interruptions.",
      "Believing a Capacity Reservation gives a discount on its own.",
      "Mixing up Dedicated Hosts (a whole physical server) and Dedicated Instances (instances on single-tenant hardware).",
      "Forgetting that stopped instances still incur EBS storage charges.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Match each scenario to a pricing option: a weekend load test, a 24/7 production DB, a fault-tolerant video transcoder." },
      { difficulty: "Medium", prompt: "Explain how Compute Savings Plans differ from EC2 Instance Savings Plans in flexibility and discount." },
      { difficulty: "Medium", prompt: "Design a purchasing mix for a web app with a steady baseline of 10 servers, daily peaks of 25, and a nightly batch job." },
      { difficulty: "Hard", prompt: "Spot capacity is interrupted with short notice. Describe an architecture (queue, checkpoints, auto scaling) that tolerates this safely." },
    ],
    interviewQuestions: [
      { question: "When would you use Spot Instances?", answer: "For fault-tolerant, flexible, or batch workloads that can handle interruption, such as rendering, big data processing, and CI jobs." },
      { question: "Why might a company choose Dedicated Hosts?", answer: "To use existing per-socket or per-core software licenses or to meet compliance requirements that need a physical server dedicated to them." },
      { question: "What is the difference between Savings Plans and On-Demand?", answer: "Savings Plans trade a one- or three-year spend commitment for a lower rate; On-Demand has no commitment and the highest rate." },
      { question: "Exam-style: A steady-state application will run for three years. Which option is the most cost-effective? (A) On-Demand (B) Spot (C) Savings Plans or Reserved Instances (D) Dedicated Hosts", answer: "C." },
      { question: "Exam-style: Which option offers the largest discount but may be interrupted?", answer: "Spot Instances." },
    ],
    prerequisites: ["ec2-basics"],
    relatedTopics: ["pricing-and-billing", "auto-scaling-and-load-balancing", "well-architected-framework"],
    keywords: ["on-demand", "spot", "savings plans", "reserved instances", "dedicated host", "capacity reservation", "cost", "pricing"],
  },

  {
    id: "shared-responsibility-model",
    title: "The Shared Responsibility Model",
    level: "beginner",
    description: "Who secures what: AWS secures the cloud itself, you secure what you put in it.",
    explanation: md(
      "Security in AWS is a split. AWS is responsible for **security *of* the cloud**: the physical data centers, hardware, networking, and the virtualization layer. You are responsible for **security *in* the cloud**: your data, identities, permissions, operating systems you manage, application code, and network configuration.",
      "The line moves with the service type:",
      "- **Infrastructure services (EC2)**: AWS secures the host and hypervisor; you patch the guest OS, configure the firewall, and protect the application and data.\n- **Container services (RDS, ECS-managed pieces)**: AWS also handles the OS and database platform patching; you manage database settings, access, and data.\n- **Abstracted / serverless services (S3, DynamoDB, Lambda)**: AWS runs even more of the stack; you mostly manage data, IAM permissions, and encryption choices.",
      "Some responsibilities are **shared**, like patch management (AWS patches the infrastructure, you patch your guest OS and apps), configuration management, and awareness/training.",
    ),
    analogy:
      "Renting an apartment: the landlord is responsible for the building's structure, the roof, and the main door lock. You are responsible for locking your own apartment door, who you give keys to, and what you leave on the table. If the landlord keeps the building safe but you leave your door wide open, a theft is on you.",
    examples: [
      {
        title: "Who handles what",
        language: "text",
        code: `Task                                   EC2      RDS      S3
-------------------------------------  -------  -------  -------
Physical data center security          AWS      AWS      AWS
Hypervisor / host patching             AWS      AWS      AWS
Guest operating system patching        YOU      AWS      AWS
Database engine patching               YOU      AWS      n/a
Network firewall rules (SG)            YOU      YOU      n/a
IAM users, roles, permissions          YOU      YOU      YOU
Data classification and encryption     YOU      YOU      YOU
Bucket public-access settings          n/a      n/a      YOU`,
      },
      {
        title: "Customer-side check: is this bucket blocking public access?",
        language: "bash",
        code: `aws s3api get-public-access-block --bucket zykit-demo-bucket-12345
aws s3api put-public-access-block --bucket zykit-demo-bucket-12345 \\
  --public-access-block-configuration \\
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true`,
        explanation: "AWS provides the control; turning it on is the customer's job.",
      },
    ],
    howItWorks: md(
      "Think in layers: physical, hardware, hypervisor, operating system, platform, application, data, and identity. For each service, ask 'does AWS operate this layer or do I?'. The more managed the service, the more layers AWS owns - but **your data and your access decisions are always yours**.",
      "AWS provides tools to meet your side: IAM, encryption, security groups, logging, and compliance reports in AWS Artifact.",
    ),
    diagram: `  +----------------------------------------------+
  |  CUSTOMER: security IN the cloud             |
  |  data | identities | OS/apps | network config|
  +----------------------------------------------+
  |  AWS: security OF the cloud                  |
  |  hypervisor | hardware | network | facilities|
  +----------------------------------------------+`,
    whyItExists: md(
      "Without a clear split, either side could assume the other handled something - and gaps are where breaches live. Spelling out the boundary helps auditors, security teams, and engineers know what to verify.",
    ),
    whenToUse: md(
      "Use the model whenever you pick a service, write a security policy, or answer a compliance questionnaire: it tells you what you must configure and what you can inherit from AWS.",
    ),
    whenNotToUse: md(
      "It is not a legal contract for a specific incident and it does not replace reading the service's own documentation; edge cases depend on the service.",
    ),
    commonMistakes: [
      "Assuming AWS patches your EC2 guest OS.",
      "Assuming a managed service means you can ignore access control.",
      "Leaving a storage bucket public and blaming the provider.",
      "Believing compliance certifications of AWS automatically make your application compliant.",
      "Forgetting that responsibilities shift per service.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Sort these into AWS vs customer: hypervisor patching, IAM policies, data center guards, application code, hardware disposal." },
      { difficulty: "Medium", prompt: "Compare the customer's responsibilities for EC2 versus Lambda versus S3. What shrinks and what never changes?" },
      { difficulty: "Medium", prompt: "Write a short checklist of five customer-side security tasks for a new RDS database." },
      { difficulty: "Hard", prompt: "A pen test finds an outdated library in an application on Elastic Beanstalk. Whose responsibility is it and why?" },
    ],
    interviewQuestions: [
      { question: "Explain the shared responsibility model.", answer: "AWS secures the infrastructure that runs its services (security of the cloud); the customer secures what they build and store on it - data, identities, configuration, and guest OS (security in the cloud)." },
      { question: "Who patches the guest OS of an EC2 instance?", answer: "The customer." },
      { question: "Who is responsible for the physical security of data centers?", answer: "AWS." },
      { question: "Exam-style: Which is a customer responsibility? (A) Hypervisor patches (B) Data center cooling (C) Security group configuration (D) Hardware replacement", answer: "C." },
      { question: "Exam-style: What is an example of a shared control?", answer: "Patch management: AWS patches the infrastructure, customers patch their guest operating systems and applications." },
    ],
    prerequisites: ["what-is-cloud-computing", "ec2-basics"],
    relatedTopics: ["iam-basics", "network-security", "security-services", "well-architected-framework"],
    keywords: ["shared responsibility", "security of the cloud", "security in the cloud", "compliance", "patching", "customer responsibility"],
  },

  {
    id: "iam-basics",
    title: "IAM Basics",
    level: "beginner",
    description: "Identity and Access Management: users, groups, roles, policies, MFA, and least privilege.",
    explanation: md(
      "**AWS Identity and Access Management (IAM)** controls *who* can do *what* on *which* resources. It is global and free to use.",
      "- **Root user**: the identity created with the account, with unrestricted access. Protect it with MFA, do not use it for daily work, and do not create access keys for it.\n- **IAM users**: identities for a specific person or application, with long-term credentials. Prefer federation or Identity Center for humans.\n- **IAM groups**: collections of users, so you attach permissions once.\n- **IAM roles**: identities with temporary credentials that anyone (or any service) *assumes*. EC2 instances and Lambda functions use roles to call AWS without stored keys.\n- **Policies**: JSON documents that allow or deny actions. Everything is denied by default; an explicit Deny always wins.\n- **MFA**: a second factor that protects sign-ins.",
      "**Least privilege** means granting only the permissions needed for the task. **AWS IAM Identity Center** gives workforce users single sign-on across accounts and applications, with permission sets mapped to roles.",
    ),
    analogy:
      "IAM is the badge system of an office building. Employees (users) get badges, departments (groups) share default access, and a visiting contractor (a role) is issued a day pass that expires. The security policy printed on each badge says which doors open. The building owner's master key (root) stays locked in a safe.",
    examples: [
      {
        title: "A least-privilege policy",
        language: "json",
        code: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadOneBucket",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::zykit-demo-bucket-12345",
        "arn:aws:s3:::zykit-demo-bucket-12345/*"
      ]
    },
    {
      "Sid": "DenyUnencryptedTransport",
      "Effect": "Deny",
      "Action": "s3:*",
      "Resource": "*",
      "Condition": { "Bool": { "aws:SecureTransport": "false" } }
    }
  ]
}`,
        explanation: "Allow read-only access to one bucket, and explicitly deny any request not made over HTTPS.",
        walkthrough: [
          { code: '"Effect": "Allow"', explanation: "Whether the statement grants or denies. Deny always overrides Allow." },
          { code: '"Action": [...]', explanation: "The API operations covered, in service:Action form." },
          { code: '"Resource": [...]', explanation: "ARNs the statement applies to. The bucket and the objects inside are separate ARNs." },
          { code: '"Condition"', explanation: "Optional extra checks, such as requiring TLS or MFA." },
        ],
      },
      {
        title: "A trust policy for a role (who may assume it)",
        language: "json",
        code: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "ec2.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}`,
        explanation: "Lets EC2 assume the role, so instances get temporary credentials without stored keys.",
      },
      {
        title: "Common CLI actions",
        language: "bash",
        code: `aws iam create-group --group-name developers
aws iam attach-group-policy --group-name developers \\
  --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess
aws iam create-user --user-name asha
aws iam add-user-to-group --user-name asha --group-name developers
aws iam list-attached-group-policies --group-name developers`,
      },
    ],
    howItWorks: md(
      "On each request, AWS evaluates all applicable policies: identity-based policies, resource-based policies, permission boundaries, and organization-level controls. The default is implicit deny. If an explicit Deny matches, the request is denied; otherwise an Allow is required somewhere applicable.",
      "When a role is assumed, the **Security Token Service (STS)** issues temporary credentials that expire automatically, which limits damage if they leak.",
    ),
    diagram: `  Request: "Can asha s3:GetObject on bucket X?"
     |
     v
  Explicit Deny anywhere? --yes--> DENIED
     | no
     v
  Some Allow that applies? --yes--> ALLOWED
     | no
     v
  Implicit deny ---------------> DENIED`,
    whyItExists: md(
      "Shared cloud accounts hold powerful capabilities. Without fine-grained identity and permissions, a mistake or compromised credential could affect everything. IAM lets teams limit blast radius and trace actions to identities.",
    ),
    whenToUse: md(
      "Always. Use groups for human permission management, roles for applications and cross-account access, MFA on root and privileged users, and Identity Center for workforce SSO.",
    ),
    whenNotToUse: md(
      "Avoid long-lived IAM user access keys when a role or Identity Center session would work. Avoid wildcard policies (`\"Action\": \"*\"`) outside tightly scoped, reviewed cases.",
    ),
    commonMistakes: [
      "Using the root user for everyday tasks, or creating root access keys.",
      "Attaching `AdministratorAccess` to everyone to make errors go away.",
      "Sharing one IAM user between people.",
      "Embedding access keys in code or a public repo instead of using roles.",
      "Forgetting that Deny overrides Allow when debugging 'access denied'.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Enable MFA on your own account and write down which identities should have it." },
      { difficulty: "Medium", prompt: "Write a policy that lets a user start and stop only EC2 instances tagged `Env=dev`. (Hint: use a Condition on `ec2:ResourceTag/Env`.)" },
      { difficulty: "Medium", prompt: "Paste the example policy into the JSON formatter or JSON Schema tool and explain each statement." },
      { difficulty: "Hard", prompt: "Design access for three teams across two accounts using roles and Identity Center instead of per-account IAM users." },
    ],
    interviewQuestions: [
      { question: "What is the principle of least privilege?", answer: "Grant only the permissions needed to perform a task, and no more, for the shortest necessary time." },
      { question: "User vs role?", answer: "A user has long-term credentials and represents a person or app; a role is assumed to get temporary credentials and is preferred for services and cross-account access." },
      { question: "What happens if two policies conflict, one allowing and one explicitly denying?", answer: "The explicit Deny wins." },
      { question: "Exam-style: How should an EC2 application securely call S3? (A) Store access keys in code (B) Attach an IAM role to the instance (C) Use the root user (D) Share a user's password", answer: "B." },
      { question: "Exam-style: Which should be protected with MFA and not used for daily tasks?", answer: "The AWS account root user." },
    ],
    prerequisites: ["shared-responsibility-model"],
    relatedTopics: ["security-services", "network-security", "monitoring-and-auditing", "interacting-with-aws"],
    keywords: ["iam", "root user", "user", "group", "role", "policy", "mfa", "least privilege", "identity center", "sts", "permissions"],
  },
];
