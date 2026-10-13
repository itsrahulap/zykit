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
      "**Cost and licensing ideas that show up on the exam**",
      "- **Fixed vs variable costs**: fixed costs (buying servers, leasing a building) are paid whether or not you use them; variable costs (cloud usage) rise and fall with consumption. The cloud shifts spending from fixed to variable.\n- **License models**: *License Included* means the software license is bundled into the hourly price (for example Windows Server or SQL Server on EC2/RDS). *Bring Your Own License (BYOL)* means you reuse a license you already own, which can lower cost if your contract allows it.\n- **Rightsizing**: matching instance types and sizes to what a workload really needs, so you do not pay for idle CPU or memory. Measure first, then shrink or change type.\n- **Managed services**: AWS runs the underlying servers, patching, backups and scaling for you (RDS, DynamoDB, Lambda), so your team spends less effort on operations and more on the product. The trade-off is less low-level control.",
      "**Automation** is a core cloud benefit: **infrastructure as code** tools such as **AWS CloudFormation** let you describe resources in a template and create, update and delete whole environments the same way every time. Repeatable stacks reduce manual mistakes, speed up recovery, and make it cheap to build a copy for testing.",
      "**How hosting evolved**: a *dedicated server* gives one customer a whole physical machine (strong isolation, expensive, you guess capacity upfront). A *virtual private server* splits one machine into virtual machines. *Shared hosting* packs many tenants onto one machine (very cheap, weak isolation, few features). *Cloud hosting* makes many machines act as one distributed system that is flexible, scalable and highly configurable. The older models still exist; the cloud simply widens the choice. In everyday use, \"cloud computing\" covers every category - compute, storage, networking, databases - not only servers.",
      "**Service models** describe how much of the stack the provider runs for you:",
      "- **IaaS** (Infrastructure as a Service): the raw building blocks - compute, storage, networking - for administrators. Every provider's core four are compute (EC2), storage (EBS, S3), databases (RDS) and networking (VPC).\n- **PaaS** (Platform as a Service): developers deploy code and the provider manages servers and OS. Example: AWS Elastic Beanstalk.\n- **SaaS** (Software as a Service): a finished product used by end customers, such as web email or a CRM.",
      "**Kinds of compute you will meet**, from most to least control:",
      "- **Dedicated / bare-metal servers**: one tenant, you control virtualization; you must guess capacity and often overpay for unused room. Used for special licensing or HPC.\n- **Virtual machines**: run on a hypervisor and share a physical host, so you pay for a slice; easy to scale and to copy as images, but you can still pay for idle vCPU and memory. The most common option.\n- **Containers**: run on a container runtime (Docker is the best known) inside a VM, share the OS kernel, pack workloads more efficiently and avoid dependency conflicts, at the cost of more operational work.\n- **Functions (serverless)**: you upload code, choose a runtime and memory, and pay only while it runs. The first request after idle may be slower (a *cold start*).",
      "**More deployment-model vocabulary**: *public cloud* or *cloud-native* means everything runs with one provider; *private cloud* is self-service on your own hardware (for example with OpenStack); *hybrid* connects on-premises and a cloud provider (via VPN or Direct Connect); *multi-cloud* means using several cloud providers. Exam trap: multi-cloud is **not** the same as hybrid. Startups usually go all-cloud, banks and large enterprises with existing data centers often go hybrid, and heavily regulated organisations are the most likely to stay on-premises.",
      "**What makes a cloud service provider (CSP)**: many services that can be combined into architectures, one unified API behind the console, CLI and SDKs, metered usage-based billing, built-in auditing of API calls (AWS CloudTrail), IaaS offerings and infrastructure-as-code automation. A company with several products behind one login but without most of these traits is a *cloud platform*, not a CSP.",
      "**Benefits vocabulary the exam expects you to tell apart**:",
      "- **High availability**: the service stays reachable because it runs in more than one server or data center, with a load balancer sending traffic only to healthy targets.\n- **Scalability**: the ability to grow capacity. *Vertical* scaling (scale up) moves to a bigger server; *horizontal* scaling (scale out) adds more servers of the same size. Scaling out is usually preferred because it also adds redundancy.\n- **Elasticity**: scaling that is *automatic* and works *both ways* - out when demand rises, in when it falls. On AWS this is EC2 Auto Scaling.\n- **Fault tolerance**: no single point of failure, usually through failover to a redundant standby (for example an RDS Multi-AZ standby in another AZ).\n- **Durability**: the ability to recover from disaster without losing data - do backups exist, do they restore, and how fast?",
      "AWS's own longer list of cloud benefits is: agility, pay-as-you-go pricing, economies of scale, global reach, security, reliability, high availability, scalability and elasticity.",
      "**Money terms**:",
      "- **CapEx** (capital expenditure): paying upfront for physical infrastructure - servers, storage, network gear, a data center - and depreciating it. It forces you to guess capacity in advance.\n- **OpEx** (operational expenditure): ongoing payments for services such as cloud usage, subscriptions, support and training. The provider owns the hardware, so you can try things without buying equipment. The cloud moves spending from CapEx to OpEx.\n- **TCO** (Total Cost of Ownership): the full direct *and* indirect cost of running something. For a data center that includes hardware, licences, installation, IT staff, training, physical security, maintenance and taxes. A fair comparison counts these hidden 'below the iceberg' costs, not just a subscription fee.\n- During a migration, costs often rise for a while because you pay for the move while still running on-premises; savings appear afterwards.",
      "Moving to the cloud does not have to make IT staff redundant: they are needed for the migration, can move into cloud roles (a network engineer becomes a cloud network engineer), may run a hybrid estate, and can shift from maintaining infrastructure to work that earns revenue - the answer the exam favours.",
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
      "Treating BYOL as always cheaper - it only helps if your existing license terms allow use on shared cloud hardware.",
      "Rightsizing once at launch and never again; usage changes, so review it regularly.",
      "Mixing up hybrid (on-premises plus one cloud, connected) with multi-cloud (several cloud providers).",
      "Treating scalability and elasticity as the same thing - elasticity is automatic and scales in as well as out.",
      "Comparing cloud costs only against hardware prices and ignoring hidden on-premises costs such as staff, power, security and maintenance (TCO).",
      "Expecting savings from day one of a migration; you often pay for both environments for a while.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "List the six advantages of cloud computing from memory, and give a one-line example of each." },
      { difficulty: "Easy", prompt: "A news site gets 50x traffic during elections and little otherwise. Explain which cloud benefits apply and why on-premises would struggle." },
      { difficulty: "Medium", prompt: "A bank must keep customer records in its own data center for regulatory reasons but wants to run analytics in the cloud. Sketch a hybrid design and name what connects the two sides." },
      { difficulty: "Medium", prompt: "Run `aws sts get-caller-identity` (or read its output in the docs) and explain each field it returns." },
      { difficulty: "Easy", prompt: "Classify each as IaaS, PaaS or SaaS: Amazon EC2, AWS Elastic Beanstalk, a hosted email service." },
      { difficulty: "Medium", prompt: "Explain the difference between high availability, fault tolerance, scalability, elasticity and durability, with one AWS example for each." },
      { difficulty: "Medium", prompt: "List ten costs that belong in a TCO estimate for an on-premises data center, marking which are hidden 'below the iceberg' costs." },
      { difficulty: "Hard", prompt: "Build a rough 3-year cost comparison for a workload that needs 20 servers year-round vs one that needs 20 servers for two months a year. Where does the cloud win and where might it not?" },
    ],
    interviewQuestions: [
      { question: "What is cloud computing?", answer: "On-demand delivery of IT resources over the internet with pay-as-you-go pricing, instead of owning and running physical infrastructure yourself." },
      { question: "Name the three cloud deployment models.", answer: "Cloud (all in the provider), on-premises (all in your own data center, sometimes called private cloud), and hybrid (a connected mix of both)." },
      { question: "What does 'trade upfront expense for variable expense' mean?", answer: "Instead of buying hardware (capital expense) before you know demand, you pay per use as an operating expense, so cost tracks actual consumption." },
      { question: "Exam-style: A company wants to stop guessing how much server capacity it will need. Which cloud benefit addresses this? (A) Economies of scale (B) Stop guessing capacity (C) Go global in minutes (D) Stop running data centers", answer: "B. You can scale up or down as demand changes instead of forecasting months ahead." },
      { question: "Exam-style: Which model keeps some workloads in a company data center and others in AWS, connected together?", answer: "Hybrid deployment." },
      { question: "Exam-style: Which statement describes a variable cost? (A) Buying a server (B) Paying per hour for compute (C) Leasing a data center (D) Buying cooling equipment", answer: "B. Variable costs scale with usage; the other three are fixed." },
      { question: "What is the benefit of a managed service?", answer: "AWS handles infrastructure maintenance such as patching, backups and scaling, reducing the customer's operational effort." },
      { question: "What does CloudFormation automate?", answer: "Creating and managing a set of AWS resources from a template, so environments are repeatable." },
      { question: "Exam-style: A team wants to deploy code without managing servers or the operating system. Which service model is this? (A) IaaS (B) PaaS (C) SaaS (D) On-premises", answer: "B. Platform as a Service, for example AWS Elastic Beanstalk." },
      { question: "Exam-style: Which describes elasticity? (A) Buying a bigger server (B) Automatically adding and removing capacity as demand changes (C) Keeping a standby database (D) Backing up data", answer: "B. Elasticity is automatic and works in both directions." },
      { question: "Scale up vs scale out?", answer: "Scaling up (vertical) moves to a larger server; scaling out (horizontal) adds more servers. Scaling out is usually preferred because it also removes the single point of failure." },
      { question: "Exam-style: A company uses AWS and another public cloud provider at the same time. What is this called?", answer: "Multi-cloud. Hybrid means on-premises infrastructure connected to a cloud." },
      { question: "What is Total Cost of Ownership (TCO)?", answer: "An estimate of all direct and indirect costs of a system, including hidden costs such as staff, physical security, maintenance and facilities, used to compare on-premises with cloud." },
      { question: "Exam-style: After moving to AWS, what typically happens to the IT staff who ran the data center?", answer: "They can shift from maintaining infrastructure to cloud roles and work that adds business value, rather than being made redundant." },
      { question: "CapEx vs OpEx?", answer: "CapEx is upfront spending on physical assets that are depreciated over time; OpEx is ongoing pay-as-you-go spending. The cloud shifts spending from CapEx to OpEx." },
    ],
    prerequisites: [],
    relatedTopics: ["aws-global-infrastructure", "shared-responsibility-model", "ec2-basics", "scalability"],
    keywords: ["cloud", "iaas", "paas", "saas", "on-demand", "pay as you go", "hybrid", "economies of scale", "elasticity", "client server", "fixed cost", "variable cost", "byol", "license included", "rightsizing", "managed services", "cloudformation", "infrastructure as code", "multi-cloud", "private cloud", "bare metal", "virtual machine", "containers", "serverless", "high availability", "scalability", "vertical scaling", "horizontal scaling", "fault tolerance", "durability", "tco", "capex", "opex", "csp"],
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
      "**More building blocks of the global network**",
      "- **AWS Wavelength**: embeds AWS compute and storage inside 5G telecom networks, so mobile apps (game streaming, live video, connected vehicles) reach servers with very low latency.\n- **AWS Local Zones**: Region extensions placed near big cities for single-digit-millisecond access; you opt in and use them like a subnet of the parent Region.\n- **AWS Global Accelerator**: gives your app two static anycast IP addresses and routes users over the AWS backbone to the nearest healthy endpoint. Unlike CloudFront it does not cache content; it speeds up and stabilises TCP/UDP traffic and fails over automatically.",
      "**Availability Zones** are one or more discrete data centers with separate power, networking and connectivity, linked by fast low-latency links. They are placed far enough apart that a single event is unlikely to hit two of them, so they share no single point of failure. Running across at least two AZs is the usual high-availability design.",
      "**Why use more than one Region?** (1) *Disaster recovery and business continuity* if a whole Region is impaired, (2) *lower latency* for users on other continents, (3) *data sovereignty and compliance* rules that require data in a given country or area, and (4) *access to services* that launch in some Regions first. Data never leaves a Region unless you choose to copy it.",
      "**US East (N. Virginia), `us-east-1`** was the first Region. It usually gets new services and features first, has the most AZs, and is where billing data and billing metrics appear - handy facts for the exam.",
      "**Regional vs global services**: most services are *Regional* and the console shows only resources in the Region you selected. *Global* services such as IAM, Route 53 and CloudFront have no Region choice. S3 is a mix: its console is global, but every bucket is created in one Region you pick.",
      "**AZ details worth knowing**",
      "- Regions are designed with at least three AZs. An AZ can be more than one building.\n- AZs in a Region sit on separate flood plains with their own power substations and backup generators, within roughly 100 km of each other, linked by redundant high-bandwidth metro fiber. Traffic between AZs is encrypted.\n- AZ *names* such as `us-east-1a` are mapped per account; AZ *IDs* such as `use1-az5` identify the same physical AZ in every account.\n- You rarely pick an AZ directly: you pick a **subnet**, and each subnet lives in exactly one AZ.\n- A *fault domain* is a part of the system whose failure is contained so it does not cascade. In AWS terms each AZ is an independent failure zone and the Region is the larger fault boundary; AWS manages finer-grained fault domains for you.",
      "**The AWS global network** is AWS's private, high-speed backbone linking its Regions and edge sites. **Points of presence (PoPs)** - edge locations and *regional edge caches* - sit between Regions and users and act as on-ramps to that backbone for faster delivery and uploads. **Direct Connect locations** are partner colocation data centers where you plug a dedicated line from your premises into AWS. **VPC endpoints** keep traffic from your VPC to AWS services on the AWS network instead of the public internet.",
      "**Edge and hybrid options compared**",
      "- **Local Zones**: compute, storage and databases near large cities, each attached to a parent Region (named like `us-west-2-lax-1a`) and offering a subset of services. You opt in from the EC2 console or API - no support ticket needed. Typical uses: media production, real-time gaming, ad tech, chip design.\n- **Wavelength Zones**: AWS compute inside telecom carriers' 5G networks. You opt in, create a subnet in the Wavelength Zone with a carrier gateway, and launch EC2 there as usual.\n- **Outposts**: AWS installs and manages its hardware in your data center or colocation site - full 42U racks or smaller 1U/2U servers - giving the same APIs and tools on-premises; also useful for data residency.\n- **VMware Cloud on AWS**: run existing VMware vSphere workloads on AWS infrastructure.\n- **Edge computing** in general means running work close to where data is produced or used (phones, IoT devices, telecom sites, edge locations), for example CloudFront Functions or Lambda@Edge.",
      "**Residency, sovereignty and special Regions**",
      "- *Data residency* is where data physically lives; *compliance boundaries* are the legal rules on where it may live; *data sovereignty* is which country's laws apply because of where the data sits.\n- **AWS GovCloud (US)** Regions are isolated Regions for sensitive US government and regulated workloads (for example ITAR or FedRAMP High). They are operated by screened US citizens and only vetted US persons can hold accounts. **FedRAMP** is the US government's standard programme for assessing and authorising cloud services.\n- **AWS China Regions** (Beijing, operated by Sinnet, and Ningxia, operated by NWCD) are completely separate from global AWS, with separate accounts, and need a Chinese business licence.\n- The **AWS European Sovereign Cloud** is a separate cloud located and operated within the EU for strict European sovereignty requirements.",
      "**High availability is not always automatic**: some services are multi-AZ by default (S3 Standard stores data across several AZs), but a single EC2 instance lives in one subnet and therefore one AZ. You get availability by launching instances in several AZs behind a load balancer - or by choosing a service option that does it for you, such as Elastic Beanstalk's high-availability setting (load balancer plus Auto Scaling group) or the RDS *Production* template, which turns on Multi-AZ.",
      "**Sustainability**: Amazon co-founded The Climate Pledge, aiming for net-zero carbon across the company, including AWS, by 2040. AWS focuses on renewable energy, data centers that are more energy-efficient than typical enterprise ones, and water stewardship (such as using recycled water for cooling).",
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
    diagram: `            AWS Global Infrastructure
 +------------- Region (eu-west-1) --------------+
 |  +- AZ a -+    +- AZ b -+    +- AZ c -+       |
 |  | data   |====| data   |====| data   |       |
 |  | centers|    | centers|    | centers|       |
 |  +--------+    +--------+    +--------+       |
 |     low-latency, encrypted private links      |
 +-----------------------------------------------+
       ^                              ^
       |                              |
  [Local Zone]                 [Edge locations]
  near a big city              cache near users
       |
  [Outposts] = AWS hardware in your data center`,
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
      "Thinking Global Accelerator and CloudFront are the same: CloudFront caches content at the edge, Global Accelerator accelerates traffic to your own endpoints.",
      "Believing that two resources in the same AZ are highly available - spread them across AZs.",
      "Assuming every service is multi-AZ by default: S3 Standard is, a single EC2 instance is not.",
      "Thinking Local Zones or Wavelength Zones are available automatically; you must opt in to them first.",
      "Expecting a normal AWS account to work in the China or GovCloud Regions; they are separate partitions with their own accounts.",
      "Searching a different Region for an S3 bucket - the S3 console is global, but the bucket itself lives in one Region.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "In your own words, explain the difference between a Region, an Availability Zone, and an edge location." },
      { difficulty: "Easy", prompt: "List the four factors for choosing a Region and rank them for an app that stores health records for Canadian patients." },
      { difficulty: "Medium", prompt: "Run the `describe-availability-zones` command above for two Regions. How many AZs does each have?" },
      { difficulty: "Easy", prompt: "Sort these into Regional or global: IAM, EC2, Route 53, RDS, CloudFront, an S3 bucket." },
      { difficulty: "Medium", prompt: "For each, pick Local Zones, Wavelength, Outposts or a normal Region: (a) a mobile AR game on 5G, (b) a factory that must keep data on-site, (c) a film studio in a big city needing low-latency rendering, (d) a standard web shop." },
      { difficulty: "Hard", prompt: "Design (on paper) a deployment that survives the loss of one AZ and then extend it to survive the loss of a whole Region. List what extra cost and complexity each step adds." },
    ],
    interviewQuestions: [
      { question: "What is an Availability Zone?", answer: "One or more discrete data centers in a Region with independent power, cooling, and networking, linked to other AZs in the Region by low-latency connections." },
      { question: "How do you choose a Region?", answer: "Compliance and data residency first, then latency to users, then which services are available there, then price." },
      { question: "What is the difference between an edge location and a Region?", answer: "Regions host your workloads; edge locations are used by services like CloudFront and Route 53 to cache and deliver content close to end users." },
      { question: "Exam-style: A company needs to keep data in a specific country by law. What should it consider first? (A) Price (B) Compliance and data residency (C) Latency (D) Number of edge locations", answer: "B. Legal requirements outrank all other Region-selection factors." },
      { question: "Exam-style: Which AWS offering places AWS-managed infrastructure inside a customer's own data center?", answer: "AWS Outposts." },
      { question: "Exam-style: Which service delivers AWS compute inside 5G networks for ultra-low latency mobile apps?", answer: "AWS Wavelength." },
      { question: "Exam-style: Which service provides static anycast IPs and routes users to the nearest healthy endpoint over the AWS backbone?", answer: "AWS Global Accelerator." },
      { question: "Give three reasons to deploy in multiple Regions.", answer: "Disaster recovery, lower latency for distant users, and data-residency or compliance requirements." },
      { question: "Exam-style: Which Region usually receives new AWS services first and is where billing metrics are reported?", answer: "US East (N. Virginia), us-east-1." },
      { question: "Exam-style: Which AWS Regions are designed for US government agencies and contractors with sensitive, regulated workloads?", answer: "AWS GovCloud (US)." },
      { question: "Exam-style: A company needs single-digit millisecond latency for users in a large city far from any Region. Which option fits? (A) Outposts (B) Local Zones (C) GovCloud (D) Edge locations", answer: "B. Local Zones extend a Region into large metropolitan areas." },
      { question: "Is a single EC2 instance highly available?", answer: "No. It runs in one subnet in one AZ; you need instances in multiple AZs behind a load balancer." },
      { question: "What is the difference between data residency and data sovereignty?", answer: "Residency is where data physically sits; sovereignty is the legal jurisdiction that governs the data because of where it sits." },
      { question: "How many AZs is a Region designed to have?", answer: "At least three, physically separated, with independent power and redundant, encrypted low-latency links." },
    ],
    prerequisites: ["what-is-cloud-computing"],
    relatedTopics: ["ec2-basics", "dns-and-cdn", "vpc-networking", "well-architected-framework", "cdn", "scalability", "disaster-recovery"],
    keywords: ["region", "availability zone", "az", "edge location", "local zones", "outposts", "latency", "data residency", "high availability", "wavelength", "global accelerator", "anycast", "multi-region", "5g", "us-east-1", "az id", "global services", "regional services", "point of presence", "regional edge cache", "direct connect location", "aws backbone", "govcloud", "fedramp", "china regions", "european sovereign cloud", "data sovereignty", "fault domain", "vmware cloud on aws", "edge computing", "climate pledge", "sustainability"],
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
      "**One-time vs repeatable actions**: use the Management Console for exploration and one-off tasks, where clicking is fast. Use the CLI, SDKs or infrastructure as code (CloudFormation) when the task must be repeated, scripted or reviewed, because the same command or template gives the same result each time and can live in version control.",
      "**Connecting to AWS**: there are three network paths. The **public internet** is the cheapest and quickest to set up, with variable performance. **AWS Site-to-Site VPN** (and Client VPN for individual users) sends encrypted traffic over the internet to a VPC. **AWS Direct Connect** is a dedicated private network connection from your site to AWS with consistent bandwidth and latency, but it takes time to provision and is not encrypted by default. Many organisations use Direct Connect for steady traffic with a VPN as backup.",
      "**Getting around the Management Console**",
      "- The search bar is the fastest way to open a service. Each service has its own console, and some are *umbrella* consoles: security groups, EBS volumes, load balancers and Auto Scaling all live inside the EC2 console.\n- The **Region selector** (top right) scopes what you see for Regional services. A resource created in one Region is invisible when another Region is selected - the classic \"my server disappeared\" moment. Global services such as IAM, Route 53 and CloudFront show *Global* instead.\n- Regions launched since 2019 are disabled by default and must be enabled (opted in) in account settings before use.\n- Console screens change often, so tutorial screenshots may not match what you see.",
      "**Under the hood**: each service exposes **endpoints** - Regional ones include the Region code, global services use a global endpoint. Every request is signed with **Signature Version 4** using an access key ID and secret access key, and names an *action* such as `DescribeInstances` or `ListBuckets` - the same action names you use in IAM policies. Calling the raw API yourself is rare; tools do the signing for you. Some names are historical: VPC operations, for example, belong to the EC2 API.",
      "**Account IDs and ARNs**",
      "- Every AWS account has a unique **12-digit account ID**. It appears in IAM sign-in URLs (or you set a friendlier *account alias*), cross-account role trust, policy conditions, ARNs and support cases. It is not a secret credential, but avoid publishing it.\n- An **Amazon Resource Name (ARN)** uniquely identifies a resource: `arn:partition:service:region:account-id:resource`. The partition is `aws` for standard Regions, `aws-cn` for China and `aws-us-gov` for GovCloud.\n- S3 bucket ARNs leave Region and account blank (`arn:aws:s3:::my-bucket`) because bucket names are globally unique. ARNs may use the `*` wildcard in IAM policies.",
      "**The AWS CLI in practice**",
      "- The program is called `aws` and runs on Windows, macOS and Linux. Version 2 is current and ships with everything it needs (no separate Python install).\n- `aws configure` asks for an access key ID, secret access key, default Region and output format (json, table, text).\n- Credentials are stored in `~/.aws/credentials` and settings in `~/.aws/config`. You can keep several **named profiles** and pick one with `--profile`; otherwise the `default` profile is used.\n- `aws s3` offers high-level commands (`ls`, `cp`, `sync`, `mb`), while `aws s3api` exposes each low-level S3 API operation.",
      "**SDKs** exist for Python, JavaScript/Node.js, Java, Go, .NET, Ruby, PHP, C++ and more. The usual pattern is: create a client for a service, then call its operations. SDKs find credentials automatically - from environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`), the shared credentials file, or an attached IAM role - so never hard-code keys.",
      "**AWS CloudShell** is a browser-based shell launched from the console. It is already signed in as your console identity, has the AWS CLI, Python, Node.js, git and other tools preinstalled, offers bash, zsh and PowerShell, keeps a small home directory per Region between sessions, and has no extra charge. It is the easy replacement for AWS Cloud9, which is closed to new customers.",
      "**AWS Tools for PowerShell** let Windows administrators call AWS with PowerShell cmdlets in Verb-Noun form (for example `New-S3Bucket`), working with objects rather than plain text.",
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
  CLI ------+--> signed HTTPS --> AWS API --> resource
  SDK ------+                       ^
                                    |
  CloudFormation template --> stack-+
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
      "Assuming Direct Connect is encrypted by default - add a VPN or MACsec if you need encryption.",
      "Building production environments by clicking in the console, which cannot be repeated or reviewed.",
      "Trying to use a newer Region without enabling it first in account settings.",
      "Hard-coding access keys in application code instead of letting the SDK pick up a role or environment variables.",
      "Publishing your account ID freely - it is not a password, but it helps attackers target you.",
      "Forgetting `--profile` and running a command in the wrong account.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Create an S3 bucket with the CLI, list it, then delete it. Note which Region it landed in." },
      { difficulty: "Medium", prompt: "Extend the YAML template to add a lifecycle rule. Validate it with `aws cloudformation validate-template`." },
      { difficulty: "Medium", prompt: "Convert the example template to JSON using the YAML/JSON converter tool and compare the readability." },
      { difficulty: "Easy", prompt: "Open CloudShell, run `aws sts get-caller-identity`, and find your 12-digit account ID in the output." },
      { difficulty: "Medium", prompt: "Break this ARN into its parts and name each: `arn:aws:iam::123456789012:user/asha`. Why is the Region empty?" },
      { difficulty: "Medium", prompt: "Set up two CLI profiles (for example `dev` and `prod`) and show how to run the same command against each." },
      { difficulty: "Hard", prompt: "Explain how you would detect and fix configuration drift on a stack. What would you do if a teammate edited a resource manually?" },
    ],
    interviewQuestions: [
      { question: "What do the Console, CLI, and SDKs have in common?", answer: "All of them send authenticated, signed requests to the same underlying AWS APIs." },
      { question: "What is infrastructure as code and why use it?", answer: "Describing infrastructure in files that tools create automatically. It makes environments repeatable, reviewable, version-controlled, and quick to rebuild." },
      { question: "What is a CloudFormation stack?", answer: "The set of resources created from a template, managed together as a single unit for create, update, and delete." },
      { question: "Exam-style: Which service helps a developer deploy a web application without manually provisioning servers and load balancers, while still being able to access the underlying resources?", answer: "AWS Elastic Beanstalk." },
      { question: "Exam-style: Which service provisions AWS resources from a JSON or YAML template?", answer: "AWS CloudFormation." },
      { question: "Exam-style: Which option gives a dedicated private connection between an on-premises data center and AWS?", answer: "AWS Direct Connect." },
      { question: "When should you prefer infrastructure as code over the console?", answer: "When actions must be repeatable, reviewable and consistent, such as creating identical environments." },
      { question: "Exam-style: Which browser-based shell is pre-authenticated with your console credentials and has the AWS CLI preinstalled? (A) AWS Cloud9 (B) AWS CloudShell (C) Systems Manager (D) AWS CLI v1", answer: "B. AWS CloudShell." },
      { question: "What uniquely identifies any AWS resource?", answer: "Its Amazon Resource Name (ARN), in the form arn:partition:service:region:account-id:resource." },
      { question: "Where does the AWS CLI store credentials and default settings?", answer: "In ~/.aws/credentials and ~/.aws/config, organised by named profiles." },
      { question: "Why might you not see an EC2 instance you just created in the console?", answer: "The Region selector is set to a different Region; EC2 is a Regional service." },
      { question: "How do SDKs get credentials without hard-coding?", answer: "Through the default credential chain: environment variables, the shared credentials/config files, or an IAM role attached to the compute resource." },
    ],
    prerequisites: ["what-is-cloud-computing"],
    relatedTopics: ["iam-basics", "aws-global-infrastructure", "serverless-and-containers", "monitoring-and-auditing", "developer-and-end-user-tools"],
    keywords: ["console", "cli", "sdk", "api", "cloudformation", "iac", "infrastructure as code", "elastic beanstalk", "cdk", "template", "stack", "direct connect", "site-to-site vpn", "public internet", "repeatable", "one-time", "cloudshell", "arn", "account id", "account alias", "region selector", "opt-in regions", "service endpoint", "signature version 4", "aws configure", "named profile", "s3api", "tools for powershell", "credential chain"],
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
      "EC2 is often called the backbone of AWS because many other services (RDS, for example) run on EC2 instances behind the scenes. For a simpler, beginner-friendly virtual server with a bundled plan - say, a WordPress site with a domain - **Amazon Lightsail** is the easy version of EC2.",
      "**The AWS Nitro System** underpins all modern instance types. It combines dedicated hardware with a very lightweight hypervisor:",
      "- **Nitro Cards** offload networking, EBS storage and instance storage from the host CPU.\n- **Nitro Security Chip** on the motherboard protects the hardware.\n- **Nitro Hypervisor** only allocates CPU and memory, giving near bare-metal performance.\n- **Nitro Enclaves** carve an isolated environment inside an instance for very sensitive data (beyond CLF-C02 depth).\n- **Bare metal** sizes (ending in `.metal`) have no hypervisor at all, so your software runs directly on the hardware.",
      "**Sizes and vCPUs**: an instance type is *family + size*. Sizes run nano, micro, small, medium, large, xlarge, 2xlarge and upward, and each step roughly doubles vCPU, memory and price. A **vCPU** is a share of the host's processors, not a whole physical CPU. Adding another instance of the same size (scaling out, ideally in another AZ) is often better for availability than moving to a bigger one. For CLF-C02, know the five family *categories* rather than every letter. General purpose also includes **Mac** instances for running macOS.",
      "**Processors and accelerators**: instances use x86 chips (Intel or AMD) or Arm chips such as **AWS Graviton**, which usually give better price-performance and energy efficiency if your software supports Arm. AWS also designs **Inferentia** (ML inference) and **Trainium** (ML training) chips. **GPUs** have thousands of small cores for parallel work such as graphics and ML training; the P and G families offer NVIDIA GPUs.",
      "**AMIs in more depth**",
      "- AMI IDs are **Region-specific**: the same image has a different ID in each Region.\n- Sources: *Quick Start* (AWS-supported, such as Amazon Linux 2023, Ubuntu, Red Hat, Windows), *AWS Marketplace* (vendor images, often paid), *community* AMIs, and your own **custom AMIs** made from a configured instance (*Create image*) so you can relaunch the same server later.\n- **Launch templates** save launch settings (AMI, type, key pair, security groups, IAM instance profile, tags, user data) with versioning. They replace the deprecated *launch configurations*.",
      "**What you set when launching**: AMI, instance type, network (VPC, subnet, public IP), IAM role (attached via an *instance profile*), storage (EBS volumes - turn on encryption, which costs nothing extra), tags, a security group, a key pair and optional user data. Security group names cannot be changed later; open only the ports you need (for example HTTP 80 for a public website).",
      "**Connecting to an instance**",
      "- **SSH with a key pair**: AWS gives you the private key (`.pem`) once; restrict it with `chmod 400`. The default user on Amazon Linux is `ec2-user`.\n- **EC2 Instance Connect**: opens a shell in the browser without managing a key file.\n- **Systems Manager Session Manager**: no open inbound port and no key pair, and sessions are logged. It needs the SSM agent and an instance profile with the `AmazonSSMManagedInstanceCore` policy.\n- **Windows** instances use RDP; you decrypt the administrator password with the key pair's private key.",
      "**Lifecycle details**: wait for both status checks (system and instance) to pass before using a new instance. A *reboot* keeps the public IP; a *stop and start* gives a new public IPv4 address. An **Elastic IP** is a static public IPv4 address you allocate to your account and attach to an instance so its address survives stop/start. AWS charges for all public IPv4 addresses, and terminating an instance does not release its Elastic IP - release ones you no longer need. Launches can occasionally fail with *insufficient capacity* because an AZ has a finite number of servers of each type.",
      "**Tenancy**: *shared* (default, multi-tenant), **Dedicated Instance** (hardware used only by your account, still virtualized, billed per instance, no host visibility) and **Dedicated Host** (a whole physical server you control, billed per host, showing sockets and cores, with instance placement and affinity). Dedicated Hosts are the choice for bring-your-own-license software licensed per socket or core, such as Microsoft SQL Server.",
      "**Windows on AWS** goes beyond EC2: license-included Windows Server AMIs, SQL Server on RDS, AWS Directory Service (managed Microsoft Active Directory), Amazon FSx for Windows File Server, AWS License Manager and Amazon WorkSpaces Windows desktops.",
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
 +---------- Physical host (one AZ) -----------+
 |   Hypervisor (Nitro)                        |
 |   +---------+  +---------+  +---------+     |
 |   | Inst. A |  | Inst. B |  | Inst. C |     |
 |   +---------+  +---------+  +---------+     |
 |    (each may belong to a different customer)|
 +---------------------------------------------+`,
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
      "Copying an AMI ID from one Region and using it in another - AMI IDs are Region-specific.",
      "Relying on a public IP that changes after stop/start; use an Elastic IP or DNS if the address must stay fixed.",
      "Leaving unused Elastic IPs allocated - public IPv4 addresses are charged and terminating the instance does not release them.",
      "Forgetting to open the port in the security group, then wondering why the web server is unreachable.",
      "Storing access keys on an instance instead of attaching an IAM role through an instance profile.",
      "Picking an Arm (Graviton) instance for software that only ships for x86.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Decode the instance type `c7g.xlarge`: what do the letter, number, extra letter and size tell you?" },
      { difficulty: "Easy", prompt: "Pick an instance family for (a) a large in-memory cache, (b) video encoding, (c) a small blog." },
      { difficulty: "Medium", prompt: "Write user data that installs a web server and serves a page showing the instance's hostname." },
      { difficulty: "Easy", prompt: "List three ways to get a shell on a Linux instance and say which needs no open inbound port." },
      { difficulty: "Medium", prompt: "Create a launch template for a web server (AMI, type, security group, user data) and explain why it beats typing the settings each time." },
      { difficulty: "Hard", prompt: "Explain what is lost, kept, and billed when you stop vs terminate an instance with one EBS root volume and one instance-store volume." },
    ],
    interviewQuestions: [
      { question: "What is an AMI?", answer: "A template with an operating system and optional software used to launch EC2 instances." },
      { question: "What does multi-tenancy mean for EC2?", answer: "Multiple customers' instances share one physical host, kept isolated by the hypervisor." },
      { question: "Which instance family suits memory-intensive workloads?", answer: "Memory optimized (R and X families)." },
      { question: "Exam-style: A company needs full control of the OS for a legacy application. Which compute service fits best?", answer: "Amazon EC2." },
      { question: "Exam-style: Who is responsible for patching the operating system on an EC2 instance?", answer: "The customer; AWS manages the underlying host and hypervisor." },
      { question: "Exam-style: Which service offers simple, bundled virtual servers for users new to the cloud? (A) EC2 (B) Lightsail (C) Lambda (D) Outposts", answer: "B. Amazon Lightsail." },
      { question: "Exam-style: Which feature keeps an instance's public IPv4 address the same after stop and start?", answer: "An Elastic IP address." },
      { question: "Exam-style: A company must use existing per-core software licences and see the physical sockets and cores. Which tenancy? (A) Shared (B) Dedicated Instance (C) Dedicated Host (D) Spot", answer: "C. Dedicated Host." },
      { question: "What is the AWS Nitro System?", answer: "The hardware and lightweight hypervisor platform behind modern EC2 instances: Nitro Cards offload networking and storage, the Nitro Security Chip protects hardware, and the Nitro Hypervisor allocates CPU and memory." },
      { question: "Which connection method needs no SSH key and no open inbound port, and logs sessions?", answer: "AWS Systems Manager Session Manager." },
      { question: "What is a launch template?", answer: "A saved, versioned set of instance launch settings (AMI, type, security groups, role, user data) used by people, Auto Scaling and other services; it replaces launch configurations." },
      { question: "Exam-style: Which AWS-designed processor gives Arm-based general-purpose instances with good price-performance?", answer: "AWS Graviton." },
    ],
    prerequisites: ["what-is-cloud-computing", "aws-global-infrastructure"],
    relatedTopics: ["ec2-pricing", "shared-responsibility-model", "auto-scaling-and-load-balancing", "block-file-object-storage", "scalability", "specialised-services"],
    keywords: ["ec2", "instance", "ami", "instance type", "hypervisor", "nitro", "user data", "multi-tenancy", "virtual machine", "lightsail", "bare metal", "nitro enclaves", "vcpu", "graviton", "arm", "gpu", "launch template", "instance profile", "key pair", "instance connect", "session manager", "elastic ip", "public ipv4", "status checks", "dedicated host", "dedicated instance", "tenancy", "mac instances", "rdp"],
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
      "**Reservation details**: Standard Reserved Instances give the biggest discount for a fixed instance family; Convertible RIs let you change family, OS or tenancy for a somewhat smaller discount; both come in 1- or 3-year terms with no, partial or all upfront payment. Reserved Instances and Savings Plans discounts can be **shared across the accounts in an AWS Organization** with consolidated billing, and unused RI capacity can be sold on the Reserved Instance Marketplace (Standard only). Compute Savings Plans are the most flexible, applying across instance families, Regions, Fargate and Lambda.",
      "**Tenancy**: *Dedicated Instances* run on hardware used only by your account but AWS picks the host and you pay a per-instance premium; *Dedicated Hosts* give a whole host you control, which matters for server-bound licenses. *Capacity Reservations* guarantee capacity in an AZ and can be combined with Savings Plans or RIs for the discount.",
      "**Two different goals**: *cost management* is about saving money; *capacity management* is about having enough resources to meet demand. Pricing options serve both - Capacity Reservations and zonal RIs secure capacity, the others cut cost.",
      "**On-Demand billing**: Linux (and Windows without a separate hourly licence charge) is billed per second with a 60-second minimum; other cases are billed per hour. Prices are always *listed* as an hourly rate - multiply by about 730 to estimate a month.",
      "**Reserved Instances in more depth**",
      "- An RI is defined by instance type (family + size), Region, tenancy and platform (for example Linux or Windows). Its discount applies automatically to matching usage.\n- **Scope**: a *Regional* RI does not reserve capacity but applies to any AZ in the Region and to any size in the family (size flexibility). A *zonal* RI reserves capacity in one AZ but has no AZ or size flexibility.\n- Standard RIs can be modified (change AZ in the Region, switch between zonal and Regional, change size for Linux default tenancy). Convertible RIs can be *exchanged* for another Convertible RI of equal or greater value with a different family, platform or tenancy.\n- **No Upfront** still bills a discounted hourly rate for every hour of the term, whether you use it or not.\n- RIs do **not** auto-renew: when the term ends, instances keep running at On-Demand rates.\n- On the **Reserved Instance Marketplace** you sell unused Standard RIs and set only the upfront price; registering as a seller requires the root user. Scheduled RIs are no longer offered.",
      "**Savings Plans are simpler than RIs**: you commit only to a dollars-per-hour spend for 1 or 3 years - no class, scope or attribute choices.",
      "- **Compute Savings Plans**: most flexible; apply to EC2, AWS Fargate and AWS Lambda regardless of family, size, AZ, Region, OS or tenancy.\n- **EC2 Instance Savings Plans**: bigger discount for one instance family in one Region; size, OS and tenancy can still change.\n- **SageMaker Savings Plans**: cover Amazon SageMaker AI usage.",
      "Dedicated hardware is not a separate payment model: Dedicated Instances and Hosts can themselves be paid for On-Demand or with a commitment discount.",
      "**Helpers that cut compute cost**: **AWS Batch** schedules and runs batch jobs and can use Spot capacity for you - simpler than managing Spot directly. **AWS Compute Optimizer** uses machine learning on your past utilisation to recommend right-sized instances.",
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
      "AWS bills each running instance by its usage. Commitment discounts (Savings Plans, RIs) are applied automatically to matching usage on your bill; you do not 'assign' them to a particular server. Spot capacity comes from spare pools at a price AWS adjusts gradually (there is no bidding any more); when AWS needs the capacity back it sends a two-minute interruption notice before reclaiming it.",
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
      "Confusing Dedicated Instances (isolated hardware, no host control) with Dedicated Hosts (host-level visibility and license reuse).",
      "Assuming a Regional RI guarantees capacity - only zonal RIs and Capacity Reservations do.",
      "Expecting RIs to renew automatically; when they expire you silently pay On-Demand rates.",
      "Thinking No Upfront means pay only for hours used - you pay for every hour of the term.",
      "Trying to sell a Convertible RI on the Reserved Instance Marketplace; only Standard RIs can be sold.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Match each scenario to a pricing option: a weekend load test, a 24/7 production DB, a fault-tolerant video transcoder." },
      { difficulty: "Medium", prompt: "Explain how Compute Savings Plans differ from EC2 Instance Savings Plans in flexibility and discount." },
      { difficulty: "Medium", prompt: "Design a purchasing mix for a web app with a steady baseline of 10 servers, daily peaks of 25, and a nightly batch job." },
      { difficulty: "Easy", prompt: "An instance is listed at a given hourly price. Show how you would estimate its monthly On-Demand cost." },
      { difficulty: "Medium", prompt: "Compare a Regional RI and a zonal RI: which gives capacity, which gives size flexibility, and when would you pick each?" },
      { difficulty: "Hard", prompt: "Spot capacity is interrupted with short notice. Describe an architecture (queue, checkpoints, auto scaling) that tolerates this safely." },
    ],
    interviewQuestions: [
      { question: "When would you use Spot Instances?", answer: "For fault-tolerant, flexible, or batch workloads that can handle interruption, such as rendering, big data processing, and CI jobs." },
      { question: "Why might a company choose Dedicated Hosts?", answer: "To use existing per-socket or per-core software licenses or to meet compliance requirements that need a physical server dedicated to them." },
      { question: "What is the difference between Savings Plans and On-Demand?", answer: "Savings Plans trade a one- or three-year spend commitment for a lower rate; On-Demand has no commitment and the highest rate." },
      { question: "Exam-style: A steady-state application will run for three years. Which option is the most cost-effective? (A) On-Demand (B) Spot (C) Savings Plans or Reserved Instances (D) Dedicated Hosts", answer: "C." },
      { question: "Exam-style: Which option offers the largest discount but may be interrupted?", answer: "Spot Instances." },
      { question: "Which Reserved Instance type allows changing instance family during the term?", answer: "Convertible Reserved Instances." },
      { question: "Exam-style: Which option guarantees EC2 capacity in an AZ without a long-term commitment?", answer: "On-Demand Capacity Reservations." },
      { question: "Exam-style: Which Savings Plan applies to EC2, Fargate and Lambda across any Region? (A) EC2 Instance Savings Plan (B) Compute Savings Plan (C) SageMaker Savings Plan (D) Standard RI", answer: "B. Compute Savings Plan." },
      { question: "What happens when a Reserved Instance term ends?", answer: "Nothing is interrupted; the instance keeps running but is billed at On-Demand rates. RIs do not auto-renew." },
      { question: "Exam-style: Which service recommends right-sized EC2 instances using machine learning on historical utilisation?", answer: "AWS Compute Optimizer." },
      { question: "Exam-style: Which managed service runs batch jobs and can use Spot Instances to lower cost?", answer: "AWS Batch." },
      { question: "Regional vs zonal Reserved Instances?", answer: "Regional RIs apply across AZs and sizes in the family but reserve no capacity; zonal RIs reserve capacity in one AZ but have no AZ or size flexibility." },
      { question: "Can you sell unused Reserved Instances?", answer: "Standard RIs can be sold on the Reserved Instance Marketplace (the seller sets the upfront price); Convertible RIs cannot." },
    ],
    prerequisites: ["ec2-basics"],
    relatedTopics: ["pricing-and-billing", "auto-scaling-and-load-balancing", "well-architected-framework"],
    keywords: ["on-demand", "spot", "savings plans", "reserved instances", "dedicated host", "capacity reservation", "cost", "pricing", "convertible ri", "standard ri", "dedicated instances", "ri sharing", "regional ri", "zonal ri", "ri marketplace", "compute savings plan", "ec2 instance savings plan", "sagemaker savings plan", "all upfront", "partial upfront", "no upfront", "per-second billing", "aws batch", "compute optimizer", "capacity management"],
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
      "**Exam rule of thumb**: if you can configure it or store data on it, it is your responsibility; if you cannot configure it, it is AWS's.",
      "**What AWS covers in detail**: hardware and physical facilities, the global infrastructure (Regions, AZs, edge locations), physical security, the software that runs compute, storage, database and networking services, and the operation of managed services. On the hardware side AWS uses the Nitro System and handles physical networking, storage hardware, kernel hardening and boot.",
      "**What the customer covers in detail**: customer data and how it is classified, applications and platforms, IAM users and permissions, guest operating systems, network and firewall configuration (security groups, network ACLs), client-side encryption, server-side encryption *settings* (for example on S3 or EBS), and protecting network traffic and monitoring (turning on VPC Flow Logs, GuardDuty, CloudTrail). Tools such as **Amazon Macie** help you find sensitive data like PII in S3, but deciding to use them is your call.",
      "If you give an employee too many permissions and they cause damage, that is still the customer's responsibility.",
      "**By cloud model**:",
      "- **On-premises**: the customer owns everything.\n- **IaaS**: the provider runs physical networking, storage, servers and virtualization.\n- **PaaS**: the provider also runs the OS, runtime and middleware.\n- **SaaS**: the provider runs almost everything; the customer manages content, sharing settings, access and usage.",
      "**By compute type**, from most to least customer work:",
      "- **EC2 bare metal**: AWS owns only the physical machine; you may even run your own hypervisor.\n- **EC2 virtual machines**: AWS runs the hypervisor, host OS and hardware; you manage the guest OS, runtime and apps. Dedicated Instances and Dedicated Hosts sit at this same level - they add single-tenant isolation, not more customer duties.\n- **Containers (ECS, EKS, especially with Fargate)**: you manage container images, configuration, deployment and attached storage.\n- **Functions (Lambda)**: you upload code and set its configuration and permissions; AWS runs everything else.",
      "Your own **code** is always your responsibility, whatever compute you choose. In architecture terms: a traditional VM design (EC2, Auto Scaling, load balancers) carries the most customer responsibility, containers less, and serverless the least.",
      "**PaaS nuance**: with Elastic Beanstalk the EC2 instances, Auto Scaling group and load balancer are visible and configurable in your account, so you carry more responsibility than with a fully hidden third-party platform.",
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
      "Thinking Dedicated Hosts shift more security work to the customer - the split is the same as regular EC2.",
      "Assuming AWS turns on encryption, Flow Logs or GuardDuty for you; enabling them is a customer choice.",
      "Believing serverless means the customer has no responsibility - your code, data and permissions are still yours.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Sort these into AWS vs customer: hypervisor patching, IAM policies, data center guards, application code, hardware disposal." },
      { difficulty: "Medium", prompt: "Compare the customer's responsibilities for EC2 versus Lambda versus S3. What shrinks and what never changes?" },
      { difficulty: "Medium", prompt: "Write a short checklist of five customer-side security tasks for a new RDS database." },
      { difficulty: "Medium", prompt: "Draw the responsibility stack for on-premises, IaaS, PaaS and SaaS side by side and shade the customer's layers." },
      { difficulty: "Hard", prompt: "A pen test finds an outdated library in an application on Elastic Beanstalk. Whose responsibility is it and why?" },
    ],
    interviewQuestions: [
      { question: "Explain the shared responsibility model.", answer: "AWS secures the infrastructure that runs its services (security of the cloud); the customer secures what they build and store on it - data, identities, configuration, and guest OS (security in the cloud)." },
      { question: "Who patches the guest OS of an EC2 instance?", answer: "The customer." },
      { question: "Who is responsible for the physical security of data centers?", answer: "AWS." },
      { question: "Exam-style: Which is a customer responsibility? (A) Hypervisor patches (B) Data center cooling (C) Security group configuration (D) Hardware replacement", answer: "C." },
      { question: "Exam-style: What is an example of a shared control?", answer: "Patch management: AWS patches the infrastructure, customers patch their guest operating systems and applications." },
      { question: "Exam-style: Under the shared responsibility model, who configures server-side encryption on an S3 bucket? (A) AWS (B) The customer (C) Both equally (D) An AWS Partner", answer: "B. AWS provides the feature; turning it on and choosing keys is the customer's job." },
      { question: "Exam-style: With AWS Lambda, what is the customer responsible for?", answer: "Their function code, its configuration and IAM permissions, and their data. AWS runs the runtime, OS, servers and network." },
      { question: "Exam-style: An employee with overly broad IAM permissions deletes production data. Whose responsibility is this?", answer: "The customer's - managing identities and permissions is security in the cloud." },
      { question: "How does responsibility change from EC2 to containers to Lambda?", answer: "It shrinks: on EC2 you manage the guest OS and up; with containers you manage images and configuration; with Lambda mainly your code, settings and data." },
      { question: "Do Dedicated Hosts change the shared responsibility split?", answer: "No. They give single-tenant hardware, but the customer's duties are the same as on regular EC2." },
    ],
    prerequisites: ["what-is-cloud-computing", "ec2-basics"],
    relatedTopics: ["iam-basics", "network-security", "security-services", "well-architected-framework"],
    keywords: ["shared responsibility", "security of the cloud", "security in the cloud", "compliance", "patching", "customer responsibility", "iaas", "paas", "saas", "bare metal", "lambda", "fargate", "encryption settings", "macie", "nitro", "elastic beanstalk"],
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
      "**Identity topics beyond users and roles**",
      "- **IAM Identity Center** (successor to AWS SSO) lets workforce users sign in once and reach many accounts and applications, using its own directory or an external identity provider.\n- **Identity federation** lets people sign in with an identity from outside AWS (a corporate directory, SAML 2.0 or OpenID Connect provider) and receive temporary credentials, so you avoid creating an IAM user per person.\n- **Cross-account access** is done with an IAM role in the target account that trusts the source account; users assume the role and get temporary credentials.\n- **Access keys** (an access key ID plus secret) are long-term credentials for the CLI and SDKs. Rotate them, never put them in code, and prefer roles. Delete keys that are unused.\n- **Password policy**: an account-level IAM setting for minimum length, required character types, expiry and reuse prevention for IAM users.",
      "**Tasks only the root user can do** include changing account settings (account name, root email address, root password), closing the account, restoring IAM permissions when the only administrator has locked themselves out, activating IAM access to the Billing console, viewing certain tax invoices, registering as a seller on the Reserved Instance Marketplace, enabling MFA Delete on an S3 bucket, fixing an S3 bucket policy that denies everyone, and signing up for AWS GovCloud (US). Everything else should be done with IAM identities. Note: changing the AWS Support plan is **no longer** root-only - an IAM user or role with the right permissions can do it, although older study material may still list it.",
      "**Account, root user and IAM users are three different things**: the *account* is the container for resources and identities; the *root user* is created with the account, signs in with an email address and password, has full access, cannot be deleted and is unique per account; *IAM users* sign in with the account ID (or alias), a user name and a password. Sign up with a team-owned email address so root access does not depend on one person. IAM policies cannot restrict the root user in its own account - only service control policies can restrict root in member accounts of an organization.",
      "**Setting up people**",
      "- A common first step is an administrator identity (IAM Identity Center user, or an IAM user in an *Admins* group with the `AdministratorAccess` managed policy), given only to the most trusted people. `PowerUserAccess` is one step down: full access except managing IAM and AWS Organizations. AWS also provides **job-function managed policies** as ready-made role-based permission sets.\n- Console users can get an autogenerated or custom password and be forced to choose a new one at first sign-in. An **account alias** gives a friendlier sign-in URL than the 12-digit account ID.\n- Applications that truly need an IAM user get a dedicated *machine user* with no console access and least-privilege permissions - but a role is better whenever one can be used.",
      "**MFA options**: *passkeys or security keys* (FIDO2 - a hardware key you tap, or a passkey on your device), *virtual authenticator apps* on a phone (you scan a QR code and enter two consecutive codes to register), and *hardware TOTP tokens*. AWS strongly recommends MFA on the root user and on IAM users.",
      "**Access key facts**: an access key has exactly the permissions of the user it belongs to. A user can have at most two keys at once (so you can rotate). The secret is shown only once at creation - lose it and you create a new key. A key must be deactivated before it can be deleted. Never share keys or commit them to a repository.",
      "**Policy anatomy**: `Version` (normally `2012-10-17`), one or more `Statement`s, each with an optional `Sid` label, `Effect` (Allow or Deny), `Action` (API operations, wildcards allowed), `Principal` (who - used in resource-based policies such as bucket policies), `Resource` (ARNs) and an optional `Condition` (source IP, requested Region, MFA present, time of day and more). Because Deny always wins, you can allow broad access and then deny one specific thing. Some console screens need several permissions, so least-privilege policies often take a few rounds of testing; the visual editor can write the JSON for you.",
      "**Guardrails that cap permissions** (they never grant anything on their own):",
      "- **Permissions boundaries**: the maximum permissions an identity-based policy can give a particular user or role.\n- **Service control policies (SCPs)** in AWS Organizations: the maximum permissions for whole accounts, for example denying use of a Region.",
      "**Least privilege, stated fully**: *just enough access* (only the permissions needed) for *just enough time* (just-in-time). Short-lived credentials beat long-lived keys.",
      "**Identity vocabulary**",
      "- A **directory service** maps names of users, groups, computers and printers to their attributes. Examples: Microsoft Active Directory (domains grouped into a *forest*, objects organised in *organizational units*), Microsoft Entra ID (formerly Azure AD) and OpenLDAP.\n- An **identity provider (IdP)** stores identities and authenticates users for other services; **federation** links an identity across separate systems.\n- **OpenID Connect** handles *authentication* (who you are); **OAuth 2.0** handles *authorization* with tokens, without sharing passwords; **SAML 2.0** is an XML standard used mainly for browser-based single sign-on.\n- **Single sign-on (SSO)** means log in once and reach many systems. **LDAP** gives *same* sign-on: one central password, but you type it into each app.\n- **Amazon Cognito** is for *your application's* users, not your staff: user pools handle sign-up and sign-in (including adaptive, risk-based authentication), and identity pools hand out temporary AWS credentials.",
      "**Credential reports** list all IAM users and the state of their passwords, keys and MFA, and **IAM Access Analyzer** and **access reports** (last accessed information) help you find unused or overly broad permissions to trim toward least privilege.",
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
      "Creating shared IAM users for a team instead of using Identity Center or roles.",
      "Leaving old access keys active after an employee or app no longer needs them.",
      "Registering the root user with one employee's personal email, so access is lost when they leave.",
      "Expecting a permissions boundary or SCP to grant access - they only limit what other policies allow.",
      "Trying to restrict the root user with an IAM policy; only an SCP (in a member account) can do that.",
      "Losing the secret access key and trying to recover it - it is shown once; create a new key instead.",
      "Using IAM users for customers of your app instead of Amazon Cognito.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Enable MFA on your own account and write down which identities should have it." },
      { difficulty: "Medium", prompt: "Write a policy that lets a user start and stop only EC2 instances tagged `Env=dev`. (Hint: use a Condition on `ec2:ResourceTag/Env`.)" },
      { difficulty: "Medium", prompt: "Paste the example policy into the JSON formatter or JSON Schema tool and explain each statement." },
      { difficulty: "Easy", prompt: "Write the policy statement that allows `s3:PutObject` on the objects of one bucket only, and label each element (Effect, Action, Resource)." },
      { difficulty: "Medium", prompt: "Rotate an access key safely: create a second key, switch the app to it, deactivate the old key, then delete it. Explain why the order matters." },
      { difficulty: "Hard", prompt: "Design access for three teams across two accounts using roles and Identity Center instead of per-account IAM users." },
    ],
    interviewQuestions: [
      { question: "What is the principle of least privilege?", answer: "Grant only the permissions needed to perform a task, and no more, for the shortest necessary time." },
      { question: "User vs role?", answer: "A user has long-term credentials and represents a person or app; a role is assumed to get temporary credentials and is preferred for services and cross-account access." },
      { question: "What happens if two policies conflict, one allowing and one explicitly denying?", answer: "The explicit Deny wins." },
      { question: "Exam-style: How should an EC2 application securely call S3? (A) Store access keys in code (B) Attach an IAM role to the instance (C) Use the root user (D) Share a user's password", answer: "B." },
      { question: "Exam-style: Which should be protected with MFA and not used for daily tasks?", answer: "The AWS account root user." },
      { question: "Exam-style: Which service gives workforce users single sign-on across multiple AWS accounts?", answer: "AWS IAM Identity Center." },
      { question: "Exam-style: Which task requires the root user? (A) Launch EC2 (B) Close the account (C) Create an S3 bucket (D) Create an IAM role", answer: "B." },
      { question: "How do you give users in one account access to resources in another?", answer: "Create a role in the resource account that trusts the other account and have users assume it." },
      { question: "Exam-style: Can an IAM administrator change the AWS Support plan, or is the root user required?", answer: "An IAM identity with the appropriate permissions can change it; it is no longer a root-only task. Closing the account or changing the root email still needs root." },
      { question: "Exam-style: What sets the maximum permissions for all accounts in an AWS Organization? (A) IAM groups (B) Permissions boundaries (C) Service control policies (D) Access keys", answer: "C. Service control policies." },
      { question: "Exam-style: Which service authenticates the end users of a mobile or web application? (A) IAM (B) IAM Identity Center (C) Amazon Cognito (D) AWS Organizations", answer: "C. Amazon Cognito." },
      { question: "How many access keys can an IAM user have, and why more than one?", answer: "Two at a time, so you can rotate: create the new key, switch over, then deactivate and delete the old one." },
      { question: "What is a permissions boundary?", answer: "A managed policy that sets the maximum permissions an identity-based policy can grant to a user or role; it grants nothing by itself." },
      { question: "SAML vs OpenID Connect vs OAuth 2.0?", answer: "SAML 2.0 is an XML standard mainly for browser SSO; OpenID Connect handles authentication (identity); OAuth 2.0 handles authorization with tokens." },
      { question: "Exam-style: Which MFA option is a physical device you tap to sign in?", answer: "A FIDO2 security key (shown in the console as 'Passkey or security key')." },
    ],
    prerequisites: ["shared-responsibility-model"],
    relatedTopics: ["security-services", "network-security", "monitoring-and-auditing", "interacting-with-aws"],
    keywords: ["iam", "root user", "user", "group", "role", "policy", "mfa", "least privilege", "identity center", "sts", "permissions", "federation", "saml", "cross-account role", "access keys", "password policy", "root user tasks", "credential report", "access analyzer", "administratoraccess", "poweruseraccess", "job function policies", "account alias", "passkey", "security key", "virtual mfa", "instance profile", "permissions boundary", "scp", "service control policy", "just-in-time", "cognito", "active directory", "entra id", "identity provider", "openid connect", "oauth", "ldap", "single sign-on", "policy condition"],
  },
];
