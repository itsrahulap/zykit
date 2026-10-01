import type { Topic } from "../../types/content";
import { md } from "./md";

export const awsIntermediateTopics: Topic[] = [
  {
    id: "auto-scaling-and-load-balancing",
    title: "Auto Scaling and Load Balancing",
    level: "intermediate",
    description: "Add and remove EC2 capacity automatically and spread traffic across it with Elastic Load Balancing.",
    explanation: md(
      "**Elasticity** means capacity follows demand. Two services work together to deliver it: **Amazon EC2 Auto Scaling** changes the number of instances, and **Elastic Load Balancing (ELB)** spreads incoming requests across whichever instances exist.",
      "An Auto Scaling group has three key numbers:",
      "- **Minimum**: the fewest instances ever running.\n- **Desired**: how many you want right now.\n- **Maximum**: the ceiling, which protects your budget.",
      "Scaling approaches:",
      "- **Dynamic scaling**: react to metrics, for example 'keep average CPU near 50%' (target tracking) or step/simple policies tied to alarms.\n- **Predictive scaling**: use machine learning on past patterns to scale ahead of a recurring peak.\n- **Scheduled scaling**: scale at known times, like a Monday-morning rush.",
      "**Load balancer types**:",
      "- **Application Load Balancer (ALB)**: layer 7 (HTTP/HTTPS). Routes by path, host, headers; good for web apps and microservices.\n- **Network Load Balancer (NLB)**: layer 4 (TCP/UDP/TLS). Very high throughput, low latency, static IPs.\n- **Gateway Load Balancer (GWLB)**: sends traffic through third-party virtual appliances such as firewalls and inspection tools.\n- Classic Load Balancer is the legacy option.",
      "Load balancers also run **health checks** and stop sending traffic to unhealthy targets.",
    ),
    analogy:
      "Imagine an airport check-in hall. The load balancer is the person at the entrance who points each traveler to the shortest open desk and stops pointing at a desk whose agent stepped away. Auto Scaling is the manager who opens more desks when the line grows and closes them when it empties - never fewer than two, never more than the hall can hold.",
    examples: [
      {
        title: "Auto Scaling group with target tracking (CLI)",
        language: "bash",
        code: `aws autoscaling create-auto-scaling-group \\
  --auto-scaling-group-name web-asg \\
  --launch-template LaunchTemplateName=web-template,Version='$Latest' \\
  --min-size 2 --desired-capacity 2 --max-size 6 \\
  --vpc-zone-identifier "subnet-aaa111,subnet-bbb222" \\
  --target-group-arns arn:aws:elasticloadbalancing:eu-west-1:111122223333:targetgroup/web/abc123 \\
  --health-check-type ELB --health-check-grace-period 120

aws autoscaling put-scaling-policy \\
  --auto-scaling-group-name web-asg \\
  --policy-name cpu50 \\
  --policy-type TargetTrackingScaling \\
  --target-tracking-configuration '{
    "PredefinedMetricSpecification": {"PredefinedMetricType": "ASGAverageCPUUtilization"},
    "TargetValue": 50.0
  }'`,
        explanation: "Two subnets in different AZs give you multi-AZ capacity; the ELB health check replaces instances that stop answering.",
      },
      {
        title: "Which load balancer?",
        language: "text",
        code: `Need                                           Choose
---------------------------------------------  -----
Route /api to one service, /img to another     ALB
HTTP/2, WebSockets, host-based routing         ALB
Millions of TCP connections, fixed IPs         NLB
Insert a firewall appliance into the path      GWLB`,
      },
    ],
    howItWorks: md(
      "Metrics (such as CPU or request count per target) flow to CloudWatch. A scaling policy compares the metric with its target and changes the desired capacity within min and max. The group launches instances from a **launch template** or terminates the least useful ones, balancing across AZs.",
      "The load balancer sits in front, registers new instances in a **target group**, health-checks them, and distributes requests. Because instances are interchangeable, the application should keep session data outside the server (for example in a cache or database).",
    ),
    diagram: `         users
           |
   [ Load Balancer ]  <- health checks
      /      |      \\
  +-----+ +-----+ +-----+
  | EC2 | | EC2 | | EC2 |   Auto Scaling group
  +-----+ +-----+ +-----+   min 2 / desired 3 / max 6
   AZ-a    AZ-b    AZ-a
       ^ CloudWatch metric drives desired count`,
    whyItExists: md(
      "Fixed capacity is wasteful when traffic is low and an outage when traffic spikes. Together these services keep cost proportional to demand and keep the application available when individual servers fail.",
    ),
    whenToUse: md(
      "Use them for any stateless web or API tier with variable load, and whenever you need self-healing: a failed instance is replaced automatically.",
    ),
    whenNotToUse: md(
      "A single stateful server (like a lone database on EC2) does not benefit from simply adding more copies. Very small, constant workloads may not need scaling at all. Serverless options like Lambda scale without you managing groups.",
    ),
    commonMistakes: [
      "Setting min = max = 1 and believing that is 'highly available'.",
      "Placing all instances in a single AZ.",
      "Storing user sessions on local disk, so scaling in loses data.",
      "Health-check grace period too short, so new instances are killed while booting.",
      "Using an ALB when you need static IPs (NLB) or the reverse.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain min, desired, and max for a group set to 2/4/10 and what happens if an instance crashes." },
      { difficulty: "Medium", prompt: "Choose dynamic, predictive, or scheduled scaling for: (a) a payroll app on the 1st and 15th, (b) a viral campaign, (c) a daily commuter app." },
      { difficulty: "Medium", prompt: "Write ALB path rules to send `/api/*` to one target group and everything else to another." },
      { difficulty: "Hard", prompt: "Design a stateless login flow so any instance can serve any user. Where does the session live?" },
    ],
    interviewQuestions: [
      { question: "Difference between EC2 Auto Scaling and ELB?", answer: "Auto Scaling changes how many instances exist; ELB distributes traffic across them and checks their health." },
      { question: "When use an NLB over an ALB?", answer: "When you need layer 4 handling, extreme performance, or static IP addresses; use an ALB for HTTP-aware routing." },
      { question: "What is predictive scaling?", answer: "Forecasting load from historical patterns and scaling capacity ahead of time." },
      { question: "Exam-style: Which service automatically adds EC2 instances when demand rises?", answer: "Amazon EC2 Auto Scaling." },
      { question: "Exam-style: Which load balancer routes traffic based on URL path?", answer: "Application Load Balancer." },
    ],
    prerequisites: ["ec2-basics", "aws-global-infrastructure"],
    relatedTopics: ["vpc-networking", "monitoring-and-auditing", "ec2-pricing", "well-architected-framework", "load-balancing", "scalability"],
    keywords: ["auto scaling", "elb", "alb", "nlb", "gwlb", "target group", "health check", "elasticity", "launch template", "desired capacity"],
  },

  {
    id: "messaging-sqs-sns",
    title: "Messaging: SQS, SNS and EventBridge",
    level: "intermediate",
    description: "Decouple components with queues and publish/subscribe topics so one failure does not cascade.",
    explanation: md(
      "In a **tightly coupled** design, service A calls service B directly and waits. If B is slow or down, A suffers. In a **loosely coupled** design, A drops a message somewhere durable and moves on; B picks it up when it can.",
      "- **Amazon SQS** (Simple Queue Service): a managed **queue**. Producers send messages, consumers poll and process them, then delete them. Messages are stored until processed. *Standard* queues offer very high throughput with at-least-once delivery and best-effort ordering; *FIFO* queues give ordering and exactly-once processing semantics with lower throughput. A **dead-letter queue** collects messages that keep failing.\n- **Amazon SNS** (Simple Notification Service): **publish/subscribe**. A publisher sends one message to a *topic*, and SNS pushes copies to every subscriber (SQS queues, Lambda, HTTPS endpoints, email, SMS, mobile push).\n- **Amazon EventBridge**: an event bus that routes events from AWS services, SaaS apps, and your code to targets based on rules, with schedules and filtering.",
      "Combining SNS and SQS gives **fan-out**: one event, many independent queues, each processed at its own pace.",
    ),
    analogy:
      "A queue is a ticket spindle in a repair workshop: customers pin job slips, and any mechanic grabs the next slip when free; slips wait safely if everyone is busy. A topic is a notice-board announcement: one note, and every team that signed up for those announcements gets its own copy.",
    examples: [
      {
        title: "Queue basics with the CLI",
        language: "bash",
        code: `QUEUE_URL=$(aws sqs create-queue --queue-name orders --query QueueUrl --output text)

aws sqs send-message --queue-url "$QUEUE_URL" \\
  --message-body '{"orderId":"A-1001","total":42.5}'

aws sqs receive-message --queue-url "$QUEUE_URL" \\
  --wait-time-seconds 10 --max-number-of-messages 1

# After processing, delete using the ReceiptHandle from the receive call:
# aws sqs delete-message --queue-url "$QUEUE_URL" --receipt-handle "<handle>"`,
        explanation: "A received message becomes invisible for the visibility timeout; if you do not delete it, it reappears for another try.",
      },
      {
        title: "Fan-out design (CloudFormation sketch)",
        language: "yaml",
        code: `Resources:
  OrderEvents:
    Type: AWS::SNS::Topic
  BillingQueue:
    Type: AWS::SQS::Queue
  ShippingQueue:
    Type: AWS::SQS::Queue
  BillingSub:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref OrderEvents
      Protocol: sqs
      Endpoint: !GetAtt BillingQueue.Arn
  ShippingSub:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref OrderEvents
      Protocol: sqs
      Endpoint: !GetAtt ShippingQueue.Arn
# A real template also needs a queue policy allowing SNS to send messages.`,
        explanation: "One 'order placed' publish reaches billing and shipping independently.",
      },
    ],
    howItWorks: md(
      "SQS stores each message redundantly across AZs. A consumer receives it, the message turns invisible for a *visibility timeout*, and the consumer deletes it when done. If the consumer crashes, the timeout expires and the message is retried. After a configured number of failed receives, it moves to the dead-letter queue.",
      "SNS delivers each published message to all subscriptions, with retries and optional filter policies so subscribers only get what they care about. EventBridge evaluates rules against event patterns and forwards matches to targets.",
    ),
    diagram: `  Producer --> [ SNS topic ] --+--> [ SQS billing ]  --> Billing workers
                               +--> [ SQS shipping ] --> Shipping workers
                               +--> Lambda (audit)
  Failed 3x ... --> [ Dead-letter queue ]`,
    whyItExists: md(
      "Direct calls tie components' availability and speed together. Messaging absorbs bursts, hides slow consumers, enables retries, and lets teams change one component without breaking others.",
    ),
    whenToUse: md(
      "Use SQS to buffer work (image processing, order handling). Use SNS for notifications and fan-out. Use EventBridge for event-driven integrations across services and SaaS, rule-based routing, and scheduled events.",
    ),
    whenNotToUse: md(
      "When the caller truly needs an immediate answer (a login check), use a synchronous call. For high-volume streaming analytics with replay, consider a streaming service such as Kinesis instead of a queue.",
    ),
    commonMistakes: [
      "Assuming Standard SQS never delivers a message twice - consumers must be idempotent.",
      "Visibility timeout shorter than the processing time, causing duplicate work.",
      "No dead-letter queue, so poison messages loop forever.",
      "Using SNS when you need buffering for a slow consumer (add an SQS queue behind it).",
      "Forgetting the access policy that lets SNS write into an SQS queue.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain in your own words the difference between a queue and a pub/sub topic." },
      { difficulty: "Medium", prompt: "Create a queue and a dead-letter queue with a max receive count of 3. Send a message and fail to delete it to watch it move." },
      { difficulty: "Medium", prompt: "Design a fan-out for 'user signed up' that sends a welcome email, creates a CRM record, and logs analytics." },
      { difficulty: "Hard", prompt: "Make a consumer idempotent against duplicate delivery. What key would you store, and where?" },
    ],
    interviewQuestions: [
      { question: "SQS vs SNS?", answer: "SQS is a pull-based queue where one consumer group processes each message; SNS is push-based pub/sub that delivers copies to many subscribers." },
      { question: "What is a dead-letter queue?", answer: "A queue that receives messages that could not be processed successfully after a set number of attempts, so they can be inspected." },
      { question: "Standard vs FIFO queue?", answer: "Standard: highest throughput, at-least-once, best-effort order. FIFO: strict ordering within a group and deduplication, with lower throughput." },
      { question: "Exam-style: Which service decouples application components by storing messages until they are processed?", answer: "Amazon SQS." },
      { question: "Exam-style: Which service sends one message to many subscribers?", answer: "Amazon SNS." },
    ],
    prerequisites: ["ec2-basics"],
    relatedTopics: ["serverless-and-containers", "auto-scaling-and-load-balancing", "queues", "scalability"],
    keywords: ["sqs", "sns", "eventbridge", "queue", "pub/sub", "fan-out", "decoupling", "dead letter", "event driven", "message"],
  },

  {
    id: "serverless-and-containers",
    title: "Serverless and Containers",
    level: "intermediate",
    description: "Lambda, ECS, EKS and Fargate: running code without managing servers, and choosing the right compute.",
    explanation: md(
      "**Serverless** does not mean no servers - it means *you* do not provision, patch, or scale them. You provide code; the service runs it when needed and bills for use.",
      "**AWS Lambda** runs a function in response to events (an HTTP request, a queue message, a file upload, a schedule). Key traits: you pay per invocation and duration, it scales automatically, and each invocation is short-lived. Invocations have limits - for example a maximum run time of 15 minutes and configurable memory - so long, heavy jobs belong elsewhere.",
      "**Containers** package an app with its dependencies so it runs the same everywhere.",
      "- **Amazon ECS**: AWS's own container orchestrator, simple and tightly integrated.\n- **Amazon EKS**: managed Kubernetes, for teams that want the Kubernetes API and ecosystem.\n- **AWS Fargate**: a serverless compute engine for containers; you define CPU and memory and it runs the tasks without you managing EC2 hosts (works with ECS and EKS).\n- **Amazon ECR**: a registry to store container images.",
      "Choosing compute: EC2 for maximum control, containers for portable packaged services, Lambda for event-driven short tasks.",
    ),
    analogy:
      "EC2 is renting a whole kitchen: full control, but you clean and maintain it. Containers are meal-prep boxes that can be reheated in any kitchen. Lambda is ordering a single dish from a ghost kitchen - it appears when you ask and you pay just for that dish.",
    examples: [
      {
        title: "A Lambda handler",
        language: "javascript",
        code: `// Pure logic you can run here: the handler shape Lambda expects.
async function handler(event) {
  const name = (event && event.name) || "world";
  const message = "Hello, " + name + "!";
  console.log("handled event", JSON.stringify(event));
  return { statusCode: 200, body: JSON.stringify({ message }) };
}

handler({ name: "Zykit" }).then((res) => console.log(res));`,
        explanation: "On AWS you would export this as the handler. The function receives an event and returns a response; the runtime and servers are not your concern.",
        walkthrough: [
          { code: "async function handler(event)", explanation: "Lambda calls your handler with the triggering event as input." },
          { code: "console.log(...)", explanation: "Logs go to CloudWatch Logs automatically on AWS." },
          { code: "return { statusCode: 200, ... }", explanation: "For an HTTP trigger, this shape becomes the response." },
        ],
      },
      {
        title: "Deploying a function (CLI)",
        language: "bash",
        code: `zip function.zip index.js
aws lambda create-function \\
  --function-name hello \\
  --runtime nodejs22.x \\
  --handler index.handler \\
  --zip-file fileb://function.zip \\
  --role arn:aws:iam::111122223333:role/lambda-basic-execution

aws lambda invoke --function-name hello --payload '{"name":"Zykit"}' \\
  --cli-binary-format raw-in-base64-out out.json && cat out.json`,
        explanation: "Check the currently supported runtime names before deploying; they change as versions retire.",
      },
      {
        title: "Which compute service?",
        language: "text",
        code: `Situation                                        Pick
-----------------------------------------------  ----------------
Legacy app needing OS access                     EC2
Short event-driven task (resize an upload)       Lambda
Microservices, want AWS-native simplicity        ECS (+ Fargate)
Team standardised on Kubernetes                  EKS
Containers but no hosts to patch                 Fargate`,
      },
    ],
    howItWorks: md(
      "When an event arrives, Lambda finds or creates an execution environment, loads your code, and runs the handler. The first call in a new environment includes a *cold start* delay. Concurrency scales out by adding environments. You pay for requests and execution time.",
      "ECS and EKS schedule containers onto capacity. With EC2 launch types you manage the hosts; with Fargate AWS supplies the capacity per task.",
    ),
    diagram: `  Event (HTTP, S3, SQS, schedule)
          |
          v
  [ Lambda ] -- scales per event, short-lived

  Container image (ECR) --> [ ECS or EKS ] --> capacity:
                                   |-- EC2 hosts you manage
                                   '-- Fargate (managed)`,
    whyItExists: md(
      "Managing servers is undifferentiated work. Serverless and managed containers let teams focus on code, scale to zero when idle, and pay for useful work rather than idle hosts.",
    ),
    whenToUse: md(
      "Lambda: APIs, glue code, file processing, scheduled jobs, event handlers. Containers: long-running services, portable workloads, microservices. Fargate: containers without cluster-host management.",
    ),
    whenNotToUse: md(
      "Avoid Lambda for jobs longer than its time limit, constant heavy compute where reserved servers would cost less, or workloads needing special OS or hardware. Avoid EKS if your team has no Kubernetes need; ECS is simpler.",
    ),
    commonMistakes: [
      "Treating Lambda as stateful - local memory and disk do not persist reliably between invocations.",
      "Giving the function an over-broad IAM role.",
      "Ignoring cold-start impact on latency-sensitive paths.",
      "Choosing Kubernetes for a handful of services without needing it.",
      "Forgetting that unbounded Lambda concurrency can overwhelm a downstream database.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Run the handler example here and change the event to include a different name." },
      { difficulty: "Medium", prompt: "Decide between Lambda, Fargate, and EC2 for: nightly 30-minute ETL, image thumbnailing on upload, a Windows legacy app." },
      { difficulty: "Medium", prompt: "Explain the difference between ECS on EC2 and ECS on Fargate in terms of who patches the hosts." },
      { difficulty: "Hard", prompt: "A Lambda connected to a relational database causes connection exhaustion at peak. Propose two mitigations." },
    ],
    interviewQuestions: [
      { question: "What is AWS Lambda?", answer: "A serverless compute service that runs code in response to events and bills by invocations and duration, scaling automatically." },
      { question: "ECS vs EKS?", answer: "ECS is AWS's proprietary orchestrator; EKS is managed Kubernetes. EKS suits teams that want Kubernetes portability and tooling." },
      { question: "What does Fargate remove?", answer: "The need to provision and manage the underlying servers for your containers." },
      { question: "Exam-style: A company wants to run code without managing servers, only when an event occurs. Which service? ", answer: "AWS Lambda." },
      { question: "Exam-style: Which service stores Docker container images?", answer: "Amazon Elastic Container Registry (ECR)." },
    ],
    prerequisites: ["ec2-basics", "iam-basics"],
    relatedTopics: ["messaging-sqs-sns", "auto-scaling-and-load-balancing", "migration-and-innovation", "scalability"],
    keywords: ["lambda", "serverless", "ecs", "eks", "fargate", "ecr", "container", "kubernetes", "cold start", "event driven"],
  },

  {
    id: "vpc-networking",
    title: "VPC Networking",
    level: "intermediate",
    description: "Your private network in AWS: subnets, internet and NAT gateways, VPN, and Direct Connect.",
    explanation: md(
      "An **Amazon VPC** (Virtual Private Cloud) is a logically isolated network you define inside a Region. You choose its IP range in **CIDR** notation (for example `10.0.0.0/16`) and carve it into **subnets**, each living in a single AZ.",
      "- **Public subnet**: has a route to an **Internet Gateway (IGW)**, so resources with public IPs can reach and be reached from the internet.\n- **Private subnet**: no direct route from the internet; ideal for databases and app servers.\n- **NAT gateway**: lets private resources start outbound connections (for updates, APIs) without accepting inbound connections. It lives in a public subnet.\n- **Route tables**: decide where traffic from a subnet goes.\n- **Virtual private gateway + Site-to-Site VPN**: an encrypted tunnel over the internet to your on-premises network.\n- **AWS Direct Connect**: a dedicated private network connection from your site to AWS, with more consistent performance than the internet.",
      "Other connectors you will meet: **VPC peering** (connect two VPCs), **Transit Gateway** (a hub for many VPCs and networks), and **VPC endpoints** (reach AWS services privately without the internet).",
    ),
    analogy:
      "A VPC is a gated campus. The main gate (internet gateway) opens onto a public plaza (public subnet) with the reception and cafe. Behind it sit private office buildings (private subnets) with no street entrance; staff walk out through a controlled side door (NAT) when they need something, but strangers cannot walk in. A private tunnel to head office is the VPN; a dedicated road is Direct Connect.",
    examples: [
      {
        title: "Planning a VPC",
        language: "text",
        code: `VPC            10.0.0.0/16        (65,536 addresses)
  public-a     10.0.0.0/24   AZ a   route 0.0.0.0/0 -> IGW   (load balancer, NAT)
  public-b     10.0.1.0/24   AZ b   route 0.0.0.0/0 -> IGW
  private-a    10.0.10.0/24  AZ a   route 0.0.0.0/0 -> NAT   (app servers)
  private-b    10.0.11.0/24  AZ b   route 0.0.0.0/0 -> NAT
  data-a       10.0.20.0/24  AZ a   no internet route        (databases)
  data-b       10.0.21.0/24  AZ b   no internet route`,
        explanation: "Use the IP/CIDR calculator tool to check ranges and avoid overlaps (important if you later connect to on-premises).",
      },
      {
        title: "Building a VPC with the CLI",
        language: "bash",
        code: `VPC=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query Vpc.VpcId --output text)
SUBNET=$(aws ec2 create-subnet --vpc-id "$VPC" --cidr-block 10.0.0.0/24 \\
  --availability-zone eu-west-1a --query Subnet.SubnetId --output text)
IGW=$(aws ec2 create-internet-gateway --query InternetGateway.InternetGatewayId --output text)
aws ec2 attach-internet-gateway --internet-gateway-id "$IGW" --vpc-id "$VPC"
RT=$(aws ec2 create-route-table --vpc-id "$VPC" --query RouteTable.RouteTableId --output text)
aws ec2 create-route --route-table-id "$RT" --destination-cidr-block 0.0.0.0/0 --gateway-id "$IGW"
aws ec2 associate-route-table --route-table-id "$RT" --subnet-id "$SUBNET"`,
        explanation: "A subnet is 'public' because its route table points to an IGW, not because of its name.",
      },
    ],
    howItWorks: md(
      "Every packet leaving a subnet is matched against that subnet's **route table**; the most specific matching route wins. `local` routes keep traffic inside the VPC. A route to an IGW makes a subnet public (instances also need a public or Elastic IP). A route to a NAT gateway lets private instances initiate outbound traffic: the NAT translates their private addresses to its own public one and returns replies.",
      "For on-premises connectivity, a VPN gives encrypted connectivity quickly over the internet, while Direct Connect takes longer to set up but gives a private, steadier link. Many designs use both: Direct Connect primary, VPN backup.",
    ),
    diagram: `   Internet
      |
  [ Internet Gateway ]
      |
 +----+------------------ VPC 10.0.0.0/16 ---------------+
 | Public subnet           Private subnet                  |
 | [ALB] [NAT GW] <------- [App servers]  (outbound only)  |
 |                          |                              |
 |                       [Database subnet - no internet]   |
 +---------+-----------------------------------------------+
           |                      |
   [Virtual private gateway]  [Direct Connect]
        VPN tunnel -------- On-premises network`,
    whyItExists: md(
      "Early cloud servers sat on flat shared networks. A VPC gives you the equivalent of your own network design - address ranges, routing, segmentation - so you can expose only what must be public and keep the rest isolated.",
    ),
    whenToUse: md(
      "Every workload on EC2, RDS, and many other services lives in a VPC. Use public subnets for load balancers, private subnets for apps and data, NAT for outbound access, VPN or Direct Connect for hybrid.",
    ),
    whenNotToUse: md(
      "Do not put databases in public subnets 'for convenience'. Do not choose Direct Connect for a quick proof of concept (lead time) - start with VPN. Avoid NAT gateways for AWS service traffic if a VPC endpoint can keep it private and cheaper.",
    ),
    commonMistakes: [
      "Overlapping CIDR ranges that block later VPC peering or VPN connectivity.",
      "Choosing a /16 everywhere without planning, or a range too small to grow.",
      "Placing a single NAT gateway in one AZ and losing outbound access if that AZ fails.",
      "Forgetting the route table association, so the subnet is not actually public.",
      "Believing Direct Connect is encrypted by default (it is private, not automatically encrypted).",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain why a subnet with an IGW route is called public and what else an instance needs to be reachable." },
      { difficulty: "Medium", prompt: "Use the CIDR calculator to split 10.0.0.0/16 into six /24 subnets without overlap." },
      { difficulty: "Medium", prompt: "Draw the route tables for public, private, and data subnets." },
      { difficulty: "Hard", prompt: "Design connectivity from an office to AWS needing high reliability. Combine Direct Connect and VPN and describe failover." },
    ],
    interviewQuestions: [
      { question: "What makes a subnet public?", answer: "A route to an Internet Gateway in its route table (plus public IP addressing for the resources)." },
      { question: "NAT gateway purpose?", answer: "Allows instances in private subnets to initiate outbound connections to the internet while preventing inbound connections from it." },
      { question: "VPN vs Direct Connect?", answer: "A VPN is an encrypted tunnel over the public internet, quick to set up; Direct Connect is a dedicated private connection with more consistent latency and bandwidth." },
      { question: "Exam-style: Which component allows internet access for a public subnet?", answer: "An Internet Gateway." },
      { question: "Exam-style: A company needs a private, dedicated link between its data center and AWS. Which service?", answer: "AWS Direct Connect." },
    ],
    prerequisites: ["aws-global-infrastructure", "ec2-basics"],
    relatedTopics: ["network-security", "dns-and-cdn", "auto-scaling-and-load-balancing", "aws-databases"],
    keywords: ["vpc", "subnet", "cidr", "internet gateway", "nat gateway", "route table", "vpn", "direct connect", "transit gateway", "peering"],
  },

  {
    id: "network-security",
    title: "Network Security: Security Groups and NACLs",
    level: "intermediate",
    description: "Two firewall layers in a VPC: stateful security groups on resources and stateless network ACLs on subnets.",
    explanation: md(
      "AWS gives you two built-in packet filters inside a VPC:",
      "- **Security group (SG)**: attached to an instance's network interface. **Stateful**: if you allow a request in, the reply is automatically allowed out, and vice versa. Only *allow* rules exist; anything not allowed is denied.\n- **Network ACL (NACL)**: attached to a subnet. **Stateless**: inbound and outbound are judged separately, so you must also allow return traffic (usually ephemeral ports). It supports *allow* and *deny* rules evaluated in number order.",
      "**Default behavior**: a new security group denies all inbound and allows all outbound. The *default* NACL of a default VPC allows all traffic in and out; a NACL you create yourself starts by denying everything.",
      "Security groups can reference *other security groups* as sources, which lets you say 'the app tier may talk to the database tier' without hard-coding IPs.",
    ),
    analogy:
      "A subnet's NACL is the guard at an office building's front desk who checks every person in and every person out against a written list, and treats the two directions as separate decisions. A security group is the receptionist at each company's door who remembers 'I invited this visitor' - so when the visitor leaves, no re-check is needed.",
    examples: [
      {
        title: "A web tier security group",
        language: "text",
        code: `Security group: web-sg   (stateful)
Direction  Protocol  Port   Source / Destination     Purpose
---------  --------  -----  -----------------------  -------------------
Inbound    TCP       443    0.0.0.0/0                public HTTPS
Inbound    TCP       22     203.0.113.10/32          admin SSH from office
Outbound   All       All    0.0.0.0/0                default egress

Security group: db-sg
Inbound    TCP       5432   source = web-sg          only app tier may connect
(No other inbound rules -> everything else denied)`,
      },
      {
        title: "A NACL pair (stateless: both directions needed)",
        language: "text",
        code: `Rule  Dir      Protocol  Ports        Source/Dest      Action
----  -------  --------  -----------  ---------------  ------
100   Inbound  TCP       443          0.0.0.0/0        ALLOW
110   Inbound  TCP       1024-65535   0.0.0.0/0        ALLOW   <- replies to our outbound calls
120   Inbound  All       All          198.51.100.0/24  DENY    (blocked bad range; lower number wins)
100   Outbound TCP       1024-65535   0.0.0.0/0        ALLOW   <- replies to clients
110   Outbound TCP       443          0.0.0.0/0        ALLOW
*     Both     All       All          0.0.0.0/0        DENY    (implicit final rule)`,
        explanation: "Rule 120 would never match traffic already allowed by rule 100/110 - NACL rules are processed by number. Put specific denies at lower numbers than broad allows.",
      },
      {
        title: "Create and open a security group",
        language: "bash",
        code: `SG=$(aws ec2 create-security-group --group-name web-sg \\
  --description "web tier" --vpc-id vpc-0abc1234 --query GroupId --output text)
aws ec2 authorize-security-group-ingress --group-id "$SG" \\
  --protocol tcp --port 443 --cidr 0.0.0.0/0`,
      },
    ],
    howItWorks: md(
      "Walk a request through: a client sends HTTPS to a web server in a subnet. Traffic first meets the **subnet's NACL inbound rules**; if allowed, it reaches the instance's **security group**, which checks inbound rules. The response skips the security group's outbound evaluation (it is tracked as part of the connection), but it must pass the **NACL outbound rules** because NACLs do not track connections.",
      "Because NACLs are blunt (per subnet, IP/port based), most day-to-day control uses security groups; NACLs are an extra layer, handy for blocking a specific IP range at the subnet edge.",
    ),
    diagram: `  client --> [ NACL in ] --> [ SG in ] --> instance
  client <-- [ NACL out ] <-- (reply auto-allowed by SG)
              ^ stateless: needs its own rule`,
    whyItExists: md(
      "Defense in depth: a mistake in one control should not expose everything. Instance-level and subnet-level filters give layered protection and different tools - SGs for precise allow-lists, NACLs for coarse allow/deny at the boundary.",
    ),
    whenToUse: md(
      "Use security groups on every resource, with tight sources. Use NACLs when you need explicit deny rules or a coarse subnet-level guard.",
    ),
    whenNotToUse: md(
      "Do not rely on a NACL alone to protect instances, and do not open `0.0.0.0/0` on administrative ports like SSH or RDP; use Systems Manager Session Manager or a bastion with restricted sources.",
    ),
    commonMistakes: [
      "Forgetting ephemeral-port return rules in a NACL and wondering why connections hang.",
      "Expecting a security group to support deny rules.",
      "Opening port 22 or 3389 to the world.",
      "Misordering NACL rule numbers so a broad allow shadows a specific deny.",
      "Hard-coding IPs where a security group reference would follow the instances automatically.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "State two differences between security groups and NACLs." },
      { difficulty: "Medium", prompt: "Write SG rules for a three-tier app (ALB, app, database) where each tier only accepts traffic from the tier before it." },
      { difficulty: "Medium", prompt: "Use the CIDR calculator to find the range for a /27 and write a NACL rule that blocks it." },
      { difficulty: "Hard", prompt: "A client times out on HTTPS although the SG allows 443 and the NACL has an inbound 443 allow. Find the most likely missing rule and explain why." },
    ],
    interviewQuestions: [
      { question: "What does stateful mean for a security group?", answer: "Return traffic for an allowed connection is automatically permitted without a separate rule." },
      { question: "Can a security group deny traffic explicitly?", answer: "No, it only has allow rules; unmatched traffic is denied by default. Use a NACL for explicit denies." },
      { question: "What are the default rules of a new security group?", answer: "All inbound denied, all outbound allowed." },
      { question: "Exam-style: Which acts at the subnet level and is stateless?", answer: "Network ACL." },
      { question: "Exam-style: Which acts at the instance level and is stateful?", answer: "Security group." },
    ],
    prerequisites: ["vpc-networking"],
    relatedTopics: ["iam-basics", "security-services", "shared-responsibility-model", "ec2-basics"],
    keywords: ["security group", "nacl", "network acl", "stateful", "stateless", "firewall", "ingress", "egress", "ephemeral ports"],
  },

  {
    id: "dns-and-cdn",
    title: "DNS and CDN: Route 53 and CloudFront",
    level: "intermediate",
    description: "Translate names to addresses with Route 53, and serve content from edge locations with CloudFront.",
    explanation: md(
      "**DNS** (Domain Name System) turns a name like `www.example.com` into an IP address. A resolver asks a chain of servers: the root, then the top-level domain (`.com`), then the domain's **authoritative** name server, and caches the answer for the record's **TTL**.",
      "**Amazon Route 53** is AWS's DNS service. It registers domains, hosts DNS zones, and checks the health of endpoints. Its **routing policies** decide which answer to return:",
      "- **Simple**: one answer.\n- **Weighted**: split traffic by percentage (canary releases).\n- **Latency-based**: send users to the Region with the lowest latency.\n- **Failover**: primary/secondary, switching on failed health checks.\n- **Geolocation / Geoproximity**: route by where the user or resource is.\n- **Multivalue answer**: return several healthy records.",
      "**Amazon CloudFront** is a **content delivery network (CDN)**. It caches copies of your content (static files, video, even API responses) in **edge locations** near users, fetching from your **origin** (S3, an ALB, any HTTP server) only on a cache miss. It also provides TLS termination, DDoS absorption, and integration with AWS WAF.",
    ),
    analogy:
      "DNS is a phone book that you consult before every call. The CDN is a chain of local libraries that keep copies of popular books, so most readers borrow from the branch around the corner instead of ordering from the central archive across the world.",
    examples: [
      {
        title: "A weighted DNS record (canary)",
        language: "json",
        code: `{
  "Comment": "Send 10% to the new version",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.example.com",
        "Type": "CNAME",
        "SetIdentifier": "new-version",
        "Weight": 10,
        "TTL": 60,
        "ResourceRecords": [{ "Value": "api-v2.example.com" }]
      }
    }
  ]
}`,
        explanation: "Apply with `aws route53 change-resource-record-sets --hosted-zone-id Z123 --change-batch file://change.json`. A second record with Weight 90 pairs with it.",
      },
      {
        title: "Inspect what a CDN returned",
        language: "bash",
        code: `curl -sI https://d111111abcdef8.cloudfront.net/logo.png | grep -iE "x-cache|age|cache-control|via"
# x-cache: Miss from cloudfront     <- first request fetched from the origin
# x-cache: Hit from cloudfront      <- later requests served from the edge`,
        explanation: "Paste the headers into the HTTP headers tool to learn what Cache-Control and Age mean.",
      },
    ],
    howItWorks: md(
      "A browser asks its resolver for the address of your name. Route 53, as the authoritative server, evaluates the routing policy and health checks and returns an answer, which the resolver caches until the TTL expires. The browser then connects to that address.",
      "With CloudFront, the name resolves to a nearby edge location. If the edge has a fresh copy it responds immediately (a *cache hit*). Otherwise it fetches from the origin, stores the result according to cache headers and policies, and responds. You can invalidate cached objects when content changes.",
    ),
    diagram: `  Browser -> Resolver -> Root -> .com TLD -> Route 53 (authoritative)
                                                |
                    answer: nearest edge IP <---+
  Browser -> Edge location --hit--> response
                   |
                  miss
                   v
               Origin (S3 / ALB)`,
    whyItExists: md(
      "People remember names, computers use numbers, and DNS bridges them. Distance adds latency, and the speed of light is not negotiable; copying content near users is the only way to make far-away users feel close.",
    ),
    whenToUse: md(
      "Use Route 53 for domains, failover, and traffic shifting. Use CloudFront for global static assets, media streaming, accelerating dynamic sites, and shielding origins from load.",
    ),
    whenNotToUse: md(
      "A CDN adds little for audiences in one location that is already next to the origin, or for content that is unique per request and uncacheable. Very low TTLs everywhere increase DNS query cost and latency.",
    ),
    commonMistakes: [
      "Setting a long TTL, then needing to repoint quickly during an incident.",
      "Caching personalised responses by accident.",
      "Forgetting that DNS changes are not instant because of resolver caching.",
      "Using a CNAME at the zone apex (use a Route 53 alias record).",
      "Not setting cache headers, so CloudFront cannot cache effectively.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Describe each step of DNS resolution for `shop.example.com` starting from an empty cache." },
      { difficulty: "Medium", prompt: "Pick a Route 53 routing policy for: (a) blue/green rollout, (b) users nearest their Region, (c) automatic standby site." },
      { difficulty: "Medium", prompt: "Look at a real site's response headers in the HTTP headers tool and determine whether a CDN served it." },
      { difficulty: "Hard", prompt: "Design caching rules for a site with static assets, a logged-in dashboard, and a public API. What do you cache, for how long, and how do you invalidate?" },
    ],
    interviewQuestions: [
      { question: "What is Route 53?", answer: "AWS's scalable DNS service, which also supports domain registration, health checks, and routing policies." },
      { question: "What is an edge location used for?", answer: "Caching and delivering content close to users, as CloudFront does." },
      { question: "What is TTL?", answer: "How long a DNS answer (or cached object) may be reused before being fetched again." },
      { question: "Exam-style: Which service reduces latency for global users by caching content at edge locations?", answer: "Amazon CloudFront." },
      { question: "Exam-style: Which Route 53 routing policy sends users to the lowest-latency Region?", answer: "Latency-based routing." },
    ],
    prerequisites: ["aws-global-infrastructure", "vpc-networking"],
    relatedTopics: ["block-file-object-storage", "security-services", "auto-scaling-and-load-balancing", "cdn", "caching"],
    keywords: ["dns", "route 53", "cloudfront", "cdn", "edge", "ttl", "routing policy", "alias", "cache", "origin"],
  },

  {
    id: "block-file-object-storage",
    title: "Block, File and Object Storage",
    level: "intermediate",
    description: "Instance store, EBS, EFS and S3: choosing a storage type, S3 classes, lifecycle rules, durability and availability.",
    explanation: md(
      "AWS offers three storage shapes:",
      "- **Block storage** (like a raw disk): **Amazon EBS** volumes attach to one EC2 instance in the same AZ (some types support multi-attach) and persist independently. **Instance store** is disk physically attached to the host: very fast, but data is lost when the instance stops or terminates. **EBS snapshots** are incremental backups stored in S3-backed storage; you can copy them across Regions.\n- **File storage**: **Amazon EFS** is a managed, elastic NFS file system for Linux that many instances can mount at once across AZs. Related options include FSx for Windows and other file systems.\n- **Object storage**: **Amazon S3** stores objects (data + metadata) in *buckets* with unlimited scale, accessed over HTTP APIs. It is not a disk you mount like a drive.",
      "**S3 storage classes** trade retrieval speed and access frequency for price:",
      "- **S3 Standard**: frequent access.\n- **S3 Express One Zone**: very low latency in a single AZ, for performance-critical data.\n- **S3 Intelligent-Tiering**: moves objects between tiers automatically when patterns are unknown.\n- **S3 Standard-IA** and **One Zone-IA**: infrequent access, lower storage price, retrieval fee.\n- **S3 Glacier Instant Retrieval**: archive with millisecond access.\n- **S3 Glacier Flexible Retrieval**: archive, retrieval in minutes to hours.\n- **S3 Glacier Deep Archive**: cheapest, retrieval within hours (long-term retention).",
      "**Lifecycle rules** move or expire objects automatically. S3 has high **durability** (designed for eleven nines, 99.999999999%, meaning data is very unlikely to be lost), which is different from **availability** (how often you can read it right now), which varies by class.",
    ),
    analogy:
      "EBS is a personal hard drive on your desk - fast, yours, but one desk at a time. EFS is a shared network folder the whole office can open. S3 is a giant warehouse with labeled boxes: you hand over a box and get a ticket, you never edit a box in place. Glacier is the deep archive basement: cheap shelves, but fetching a box takes a while.",
    examples: [
      {
        title: "S3 lifecycle configuration",
        language: "json",
        code: `{
  "Rules": [
    {
      "ID": "age-out-logs",
      "Status": "Enabled",
      "Filter": { "Prefix": "logs/" },
      "Transitions": [
        { "Days": 30,  "StorageClass": "STANDARD_IA" },
        { "Days": 90,  "StorageClass": "GLACIER_IR" },
        { "Days": 365, "StorageClass": "DEEP_ARCHIVE" }
      ],
      "Expiration": { "Days": 2555 },
      "NoncurrentVersionExpiration": { "NoncurrentDays": 30 }
    }
  ]
}`,
        explanation: "Apply with `aws s3api put-bucket-lifecycle-configuration --bucket NAME --lifecycle-configuration file://lifecycle.json`. Check minimum storage durations and transition rules for each class first.",
      },
      {
        title: "Everyday storage commands",
        language: "bash",
        code: `# S3
aws s3 cp report.csv s3://zykit-demo-bucket-12345/reports/report.csv --storage-class STANDARD_IA
aws s3 sync ./site s3://zykit-demo-bucket-12345/site --delete
aws s3 ls s3://zykit-demo-bucket-12345/reports/

# EBS volume and snapshot
aws ec2 create-volume --size 20 --volume-type gp3 --availability-zone eu-west-1a
aws ec2 create-snapshot --volume-id vol-0abc1234 --description "pre-upgrade"`,
      },
      {
        title: "Which storage?",
        language: "text",
        code: `Need                                        Choose
------------------------------------------  ----------------------
Boot disk / database volume for one EC2     EBS
Scratch data, caches, can be lost           Instance store
Shared files for many Linux servers         EFS
Images, backups, data lake, static site     S3
Rarely read compliance archive              S3 Glacier Deep Archive`,
      },
    ],
    howItWorks: md(
      "EBS volumes are network-attached and replicated within their AZ, so they survive an instance stop but not the loss of the AZ - snapshots protect against that. EFS replicates data across multiple AZs and grows and shrinks automatically. S3 replicates objects across multiple AZs (except One Zone classes) and offers versioning, replication to other Regions, encryption, and access controls.",
      "Access to S3 is controlled by IAM policies, bucket policies, and Block Public Access settings. Objects can be fetched through presigned URLs that grant temporary access.",
    ),
    diagram: `  EC2 instance
    |-- Instance store (local, ephemeral)
    |-- EBS volume (one AZ)  --snapshots--> S3-backed storage
    '-- EFS mount (shared, multi-AZ)

  Application / users --HTTP API--> S3 bucket (objects)
        lifecycle: Standard -> IA -> Glacier -> Deep Archive -> expire`,
    whyItExists: md(
      "Different data has different access patterns, performance needs, and value. One storage type for everything would be too slow, too expensive, or too fragile. Specialised storage types match cost to need.",
    ),
    whenToUse: md(
      "Use EBS for databases and boot volumes, EFS for shared Linux file systems, S3 for static content, backups, logs, and analytics data, lifecycle rules to cut cost as data ages, and Intelligent-Tiering when access is unpredictable.",
    ),
    whenNotToUse: md(
      "Do not keep irreplaceable data on instance store. Do not use S3 as a low-latency block device for a database. Do not put hot data in deep archive classes - retrieval is slow and fees apply.",
    ),
    commonMistakes: [
      "Treating durability and availability as the same thing.",
      "Leaving buckets public.",
      "Forgetting EBS volumes and snapshots keep costing after instances are deleted.",
      "Moving small objects to cold classes where minimum size or duration charges outweigh savings.",
      "Using One Zone classes for data you cannot recreate.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Classify each as block, file, or object: EBS, EFS, S3, instance store." },
      { difficulty: "Medium", prompt: "Write lifecycle rules for application logs kept 7 years with the cheapest cost and rare retrieval." },
      { difficulty: "Medium", prompt: "Use the unit converter to estimate the monthly size of 1 TB written daily and what that means for storage class choice." },
      { difficulty: "Hard", prompt: "Explain how you would restore a database volume after an AZ failure using snapshots, and what data could be lost." },
    ],
    interviewQuestions: [
      { question: "Durability vs availability for S3?", answer: "Durability is the likelihood data is not lost (eleven nines); availability is the likelihood you can access it at a moment, which differs between classes." },
      { question: "EBS vs EFS?", answer: "EBS is block storage usually attached to a single instance in one AZ; EFS is a shared network file system accessible from many instances across AZs." },
      { question: "What happens to instance store data when the instance stops?", answer: "It is lost." },
      { question: "Exam-style: Which S3 class is cheapest for long-term archives retrieved rarely?", answer: "S3 Glacier Deep Archive." },
      { question: "Exam-style: Which feature automatically moves objects between storage classes over time?", answer: "S3 Lifecycle rules (or S3 Intelligent-Tiering for unpredictable access)." },
    ],
    prerequisites: ["ec2-basics", "iam-basics"],
    relatedTopics: ["aws-databases", "dns-and-cdn", "security-services", "pricing-and-billing", "migration-and-innovation"],
    keywords: ["s3", "ebs", "efs", "instance store", "glacier", "storage class", "lifecycle", "snapshot", "durability", "object storage", "express one zone"],
  },

  {
    id: "aws-databases",
    title: "AWS Database Services",
    level: "intermediate",
    description: "RDS, Aurora, DynamoDB, Redshift and the specialised and migration database services.",
    explanation: md(
      "AWS offers purpose-built databases rather than one-size-fits-all.",
      "- **Amazon RDS**: managed relational databases (MySQL, PostgreSQL, MariaDB, Oracle, SQL Server, Db2). AWS handles backups, patching, and failover (Multi-AZ); you manage schema and queries.\n- **Amazon Aurora**: AWS's cloud-built relational engine compatible with MySQL and PostgreSQL, with storage replicated across AZs and fast failover.\n- **Amazon DynamoDB**: serverless key-value and document NoSQL database with single-digit-millisecond performance at nearly any scale.\n- **Amazon Redshift**: data warehouse for analytic SQL over large datasets.\n- **Amazon ElastiCache**: managed in-memory cache (Redis-compatible and Memcached) to speed up reads. **DAX** is an in-memory cache specifically for DynamoDB.\n- **Amazon MemoryDB**: a durable, Redis-compatible in-memory database for use as a primary store.\n- **Amazon DocumentDB**: MongoDB-compatible document database.\n- **Amazon Neptune**: graph database for highly connected data.\n- **Amazon Keyspaces**: managed Cassandra-compatible database.\n- **Amazon Timestream**: time-series data.",
      "Migration helpers: **AWS Database Migration Service (DMS)** moves data between databases, often with little downtime, and **AWS Schema Conversion Tool (SCT)** helps convert schemas and code when changing engines (for example Oracle to PostgreSQL).",
      "Note: Amazon QLDB (ledger database) was announced for end of support, so treat it as retired and look at alternatives when you meet it in older material. Service lineups change - verify in current docs.",
    ),
    analogy:
      "Choosing a database is like choosing storage furniture. A relational database is a filing cabinet with labeled, linked folders and strict forms. DynamoDB is a wall of numbered lockers - blazing fast to open by number, not for complicated questions. Redshift is a library's reading room set up for analysts to compare thousands of books at once. A cache is the sticky note on your monitor.",
    examples: [
      {
        title: "Create a DynamoDB table and use it",
        language: "bash",
        code: `aws dynamodb create-table --table-name Orders \\
  --attribute-definitions AttributeName=customerId,AttributeType=S AttributeName=orderId,AttributeType=S \\
  --key-schema AttributeName=customerId,KeyType=HASH AttributeName=orderId,KeyType=RANGE \\
  --billing-mode PAY_PER_REQUEST

aws dynamodb put-item --table-name Orders \\
  --item '{"customerId":{"S":"c-1"},"orderId":{"S":"o-100"},"total":{"N":"42.5"}}'

aws dynamodb query --table-name Orders \\
  --key-condition-expression "customerId = :c" \\
  --expression-attribute-values '{":c":{"S":"c-1"}}'`,
        explanation: "Access patterns drive the key design: query by partition key (customer), sort by order id.",
      },
      {
        title: "Which database?",
        language: "text",
        code: `Need                                               Choose
-------------------------------------------------  ---------------------
Familiar SQL, existing engine, managed backups     RDS
High-performance MySQL/PostgreSQL, fast failover   Aurora
Huge scale key-value, serverless, ms latency       DynamoDB
Analytics across billions of rows                  Redshift
Speed up repeated reads                            ElastiCache / DAX
Social graph, fraud rings                          Neptune
Move Oracle to PostgreSQL                          SCT + DMS`,
      },
    ],
    howItWorks: md(
      "RDS runs a database engine on managed instances; Multi-AZ keeps a standby copy in another AZ and fails over automatically, while read replicas scale reads. Aurora separates compute from a shared, replicated storage layer that grows automatically. DynamoDB partitions data by key across many servers and replicates it across AZs; you pay per request or provision capacity.",
      "Redshift stores data in columns and spreads queries across nodes, so aggregate analytics are fast. Caches sit in front of a database and answer repeat reads from memory.",
    ),
    diagram: `  App --> ElastiCache / DAX (hot reads)
     |
     +--> RDS / Aurora   (relational, SQL, transactions)
     +--> DynamoDB       (key-value, scale-out)
     '--> Redshift       (analytics, columns)

  On-prem DB --[SCT convert schema]--> [DMS replicate] --> target DB`,
    whyItExists: md(
      "Running databases yourself means patching, backups, failover, and capacity planning. Managed databases remove that, and specialised engines fit different data shapes far better than forcing everything into one model.",
    ),
    whenToUse: md(
      "Pick the engine by data shape and access pattern: relational for joins and transactions, DynamoDB for predictable key-based access at scale, Redshift for analytics, caches for read acceleration.",
    ),
    whenNotToUse: md(
      "Do not use DynamoDB when you need ad-hoc relational queries over many fields. Do not use RDS for petabyte-scale analytics. Do not run your own database on EC2 unless you need control a managed service cannot give.",
    ),
    commonMistakes: [
      "Using a relational database for everything out of habit, or NoSQL without defining access patterns first.",
      "Believing Multi-AZ improves read throughput (read replicas do; Multi-AZ is for availability).",
      "Skipping backup and retention settings review.",
      "Leaving a database publicly accessible.",
      "Treating DMS as a schema converter (that is SCT's job).",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Match each to a database: shopping-cart sessions with millisecond reads, a monthly sales report across years of data, a friend-of-friend recommendation." },
      { difficulty: "Medium", prompt: "Explain Multi-AZ vs read replica and when you would use each." },
      { difficulty: "Medium", prompt: "Design a DynamoDB key schema for 'get all orders for a customer, newest first'." },
      { difficulty: "Hard", prompt: "Plan a migration from on-premises Oracle to Aurora PostgreSQL using SCT and DMS, including how to minimise cutover downtime." },
    ],
    interviewQuestions: [
      { question: "RDS vs DynamoDB?", answer: "RDS is managed relational SQL with joins and transactions; DynamoDB is a serverless key-value/document store that scales horizontally for known access patterns." },
      { question: "What is DMS?", answer: "A service that migrates data between databases, including continuous replication to reduce downtime." },
      { question: "What does ElastiCache provide?", answer: "A managed in-memory cache (Redis-compatible/Memcached) to cut read latency and database load." },
      { question: "Exam-style: Which service is a petabyte-scale data warehouse?", answer: "Amazon Redshift." },
      { question: "Exam-style: Which service converts a database schema when migrating between engines?", answer: "AWS Schema Conversion Tool (SCT)." },
    ],
    prerequisites: ["vpc-networking", "block-file-object-storage"],
    relatedTopics: ["migration-and-innovation", "security-services", "serverless-and-containers", "caching", "databases"],
    keywords: ["rds", "aurora", "dynamodb", "redshift", "elasticache", "dax", "memorydb", "documentdb", "neptune", "dms", "sct", "nosql"],
  },

  {
    id: "monitoring-and-auditing",
    title: "Monitoring and Auditing",
    level: "intermediate",
    description: "CloudWatch for performance, CloudTrail for who-did-what, Config for resource state, and Trusted Advisor for advice.",
    explanation: md(
      "Four services answer four different questions:",
      "- **Amazon CloudWatch** - *How is it performing?* Collects **metrics** (CPU, request counts), **logs**, and events; lets you build **dashboards** and **alarms** that notify or trigger actions such as Auto Scaling.\n- **AWS CloudTrail** - *Who did what, when?* Records API calls and console actions (management events, optionally data events) for auditing and investigation. **CloudTrail Insights** flags unusual activity patterns.\n- **AWS Config** - *What does my configuration look like and did it change?* Records resource configurations over time and evaluates them against rules (for example 'all volumes must be encrypted').\n- **AWS Trusted Advisor** - *What could I improve?* Checks your account against best practices in categories: cost optimization, performance, security, fault tolerance, service limits, and operational excellence. The number of available checks depends on your support plan.",
      "Related services: **AWS Health** (notices about AWS events that affect you), **X-Ray** (tracing requests across services), and **Systems Manager** (operational management of fleets).",
    ),
    analogy:
      "CloudWatch is the dashboard of a car: speed, fuel, warning lights. CloudTrail is the car's black-box recorder: every door opened and button pressed, with the driver's identity. Config is the maintenance log showing how the car was modified over time. Trusted Advisor is the mechanic who looks over the car and says 'your tires are worn'.",
    examples: [
      {
        title: "A CPU alarm",
        language: "bash",
        code: `aws cloudwatch put-metric-alarm \\
  --alarm-name web-high-cpu \\
  --namespace AWS/EC2 --metric-name CPUUtilization \\
  --dimensions Name=AutoScalingGroupName,Value=web-asg \\
  --statistic Average --period 300 --evaluation-periods 2 \\
  --threshold 80 --comparison-operator GreaterThanThreshold \\
  --alarm-actions arn:aws:sns:eu-west-1:111122223333:ops-alerts`,
        explanation: "If average CPU stays above 80% for two 5-minute periods, notify the SNS topic.",
      },
      {
        title: "Who deleted that bucket? (CloudTrail)",
        language: "bash",
        code: `aws cloudtrail lookup-events \\
  --lookup-attributes AttributeKey=EventName,AttributeValue=DeleteBucket \\
  --max-results 5 \\
  --query "Events[].[EventTime,Username,EventName]" --output table`,
        explanation: "Lookup covers recent management events; for long-term analysis send the trail to S3.",
      },
      {
        title: "A Config rule (CloudFormation)",
        language: "yaml",
        code: `Resources:
  EncryptedVolumesRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: encrypted-volumes
      Source:
        Owner: AWS
        SourceIdentifier: ENCRYPTED_VOLUMES
      Scope:
        ComplianceResourceTypes: ["AWS::EC2::Volume"]`,
      },
    ],
    howItWorks: md(
      "Services publish metrics to CloudWatch automatically (basic metrics at regular intervals; detailed monitoring is more frequent). Agents can add memory, disk, and application logs. Alarms evaluate metrics against thresholds and fire actions. CloudTrail delivers event logs to S3 and optionally CloudWatch Logs, and records identity, source IP, time, and request parameters. Config snapshots resource state and flags noncompliance.",
    ),
    diagram: `  Resources --metrics/logs--> CloudWatch --alarm--> SNS / Auto Scaling
  Every API call ----------> CloudTrail --> S3 / audit
  Resource config changes -> Config --rules--> compliant / non-compliant
  Account best practices -> Trusted Advisor --> recommendations`,
    whyItExists: md(
      "You cannot fix, secure, or optimise what you cannot see. Monitoring catches problems early, auditing answers 'who did that', and configuration tracking supports compliance and incident response.",
    ),
    whenToUse: md(
      "Turn on CloudTrail in every account, set alarms on key health metrics, use Config for compliance rules, and review Trusted Advisor regularly for cost and security wins.",
    ),
    whenNotToUse: md(
      "CloudWatch is not an audit log of user actions (use CloudTrail), and CloudTrail is not a performance monitor (use CloudWatch). Do not treat Trusted Advisor as a complete security audit.",
    ),
    commonMistakes: [
      "Mixing up CloudWatch and CloudTrail.",
      "Creating alarms nobody receives or acts on.",
      "Not retaining CloudTrail logs long enough for investigations.",
      "Alerting on too many noisy metrics until the team ignores them.",
      "Assuming all Trusted Advisor checks are available on every support plan.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Which service answers each: 'Why is the app slow?', 'Who changed the security group?', 'Is every volume encrypted?'" },
      { difficulty: "Medium", prompt: "Create an alarm on a metric and an SNS email subscription. Trigger it and confirm the notification." },
      { difficulty: "Medium", prompt: "Use the cron builder tool to design a schedule for a nightly EventBridge rule that runs a cleanup job." },
      { difficulty: "Hard", prompt: "Outline an incident investigation using CloudWatch, CloudTrail and Config for 'an S3 bucket became public overnight'." },
    ],
    interviewQuestions: [
      { question: "CloudWatch vs CloudTrail?", answer: "CloudWatch monitors performance and operational data (metrics, logs, alarms); CloudTrail records API activity for governance and audit." },
      { question: "What is AWS Config used for?", answer: "Recording resource configuration history and evaluating it against compliance rules." },
      { question: "What are Trusted Advisor categories?", answer: "Cost optimization, performance, security, fault tolerance, service limits, and operational excellence." },
      { question: "Exam-style: Which service logs API calls made in an AWS account?", answer: "AWS CloudTrail." },
      { question: "Exam-style: Which service can alarm when CPU utilisation exceeds a threshold?", answer: "Amazon CloudWatch." },
    ],
    prerequisites: ["iam-basics", "ec2-basics"],
    relatedTopics: ["security-services", "pricing-and-billing", "well-architected-framework", "monitoring-and-observability"],
    keywords: ["cloudwatch", "cloudtrail", "config", "trusted advisor", "alarm", "metrics", "logs", "audit", "dashboard", "insights"],
  },
];
