import type { Topic } from "../../types/content";
import { md } from "./md";

export const awsIntermediateTopics: Topic[] = [
  {
    id: "auto-scaling-and-load-balancing",
    title: "Auto Scaling and Load Balancing",
    level: "intermediate",
    description: "Add and remove EC2 capacity automatically and spread traffic across it with Elastic Load Balancing.",
    explanation: md(
      "**Elasticity** means capacity follows demand. **Amazon EC2 Auto Scaling** changes how many instances run. **Elastic Load Balancing (ELB)** spreads requests across them.",
      "An Auto Scaling group has three key numbers:",
      "- **Minimum**: the fewest instances ever running.\n- **Desired**: how many you want right now.\n- **Maximum**: the ceiling, which protects your budget.",
      "Scaling approaches:",
      "- **Dynamic scaling**: react to metrics, for example 'keep average CPU near 50%' (target tracking) or step/simple policies tied to alarms.\n- **Predictive scaling**: use machine learning on past patterns to scale ahead of a recurring peak.\n- **Scheduled scaling**: scale at known times, like a Monday-morning rush.",
      "**Load balancer types**:",
      "- **Application Load Balancer (ALB)**: layer 7 (HTTP/HTTPS). Routes by path, host, headers; good for web apps and microservices.\n- **Network Load Balancer (NLB)**: layer 4 (TCP/UDP/TLS). Very high throughput, low latency, static IPs.\n- **Gateway Load Balancer (GWLB)**: sends traffic through third-party virtual appliances such as firewalls and inspection tools.\n- Classic Load Balancer is the legacy option.",
      "Load balancers also run **health checks** and stop sending traffic to unhealthy targets.",
      "Exam angle: Auto Scaling is about **capacity and cost** (run only what you need now). ELB is about **availability** (one entry point, traffic spread across healthy targets in several AZs). The service is Elastic Load Balancing; ALB, NLB, GWLB and CLB are its load balancer types.",
      "Details the exam likes:",
      "- **ALB** supports content-based routing (host, path, headers, query strings) and can be protected by **AWS WAF**.\n- **NLB** handles millions of requests per second and sudden spikes with ultra-low latency, and gives a **static IP per AZ**. Good for gaming, IoT and other non-HTTP traffic.\n- **GWLB** deploys and scales fleets of third-party firewalls and intrusion detection/prevention appliances, using the GENEVE protocol.\n- **CLB** (legacy) registers instances directly, without target groups. AWS recommends moving to ALB or NLB.",
      "A load balancer helps even in front of one instance. You get a stable DNS name, can add instances later, and can attach AWS WAF and free **AWS Certificate Manager (ACM)** TLS certificates.",
      "**Launch templates** describe what to launch (AMI, instance type, key pair, security groups). They are versioned; the group uses a specific version or the latest. The older launch *configurations* are deprecated.",
    ),
    analogy:
      "Think of an airport check-in hall. The load balancer is the person at the entrance who sends each traveler to the shortest open desk, and skips any desk whose agent stepped away. Auto Scaling is the manager who opens desks when the line grows and closes them when it empties: never fewer than two, never more than the hall can hold.",
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
      "Metrics (such as CPU or requests per target) flow to CloudWatch. A scaling policy compares the metric with its target and changes desired capacity, staying within min and max. The group launches instances from a **launch template** or terminates the least useful ones, balancing across AZs.",
      "The load balancer registers new instances in a **target group**, health-checks them and spreads requests. Instances are interchangeable, so keep session data off the server (for example in a cache or database).",
      "A **listener** (such as HTTP on port 80 or HTTPS on 443) receives traffic and forwards it to a target group by its rules. Targets can be EC2 instances, IP addresses, Lambda functions or another ALB. The health check calls a path and expects a healthy response (such as HTTP 200) a set number of times in a row.",
      "By default an Auto Scaling group uses only **EC2 status checks** (is the instance running?). Switch to **ELB health checks** so instances whose app stopped answering are replaced too. **Scale-in protection** stops chosen instances from being terminated.",
      "When an instance is removed, **deregistration delay** (connection draining) lets in-flight requests finish. Users reach the app through a Route 53 **alias** record to the load balancer's DNS name, never to instance IPs.",
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
      "Fixed capacity wastes money when traffic is low and causes outages when it spikes. These services keep cost in line with demand and keep the app up when single servers fail.",
    ),
    whenToUse: md(
      "Use them for any stateless web or API tier with changing load, and whenever you want self-healing: failed instances are replaced automatically.",
    ),
    whenNotToUse: md(
      "A single stateful server (like a lone database on EC2) gains nothing from extra copies. Small, steady workloads may not need scaling. Serverless options like Lambda scale without groups to manage.",
    ),
    commonMistakes: [
      "Setting min = max = 1 and believing that is 'highly available'.",
      "Placing all instances in a single AZ.",
      "Storing user sessions on local disk, so scaling in loses data.",
      "Health-check grace period too short, so new instances are killed while booting.",
      "Using an ALB when you need static IPs (NLB) or the reverse.",
      "Terminating instances by hand to 'shut down' an app: the group simply launches replacements. Delete or scale the group itself.",
      "Leaving the group on EC2 status checks only, so an instance with a crashed app keeps receiving traffic.",
      "Pointing DNS at instance IPs instead of an alias to the load balancer.",
      "Thinking ELB is mainly a cost-saving tool. Auto Scaling saves cost; ELB provides availability.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain min, desired, and max for a group set to 2/4/10 and what happens if an instance crashes." },
      { difficulty: "Medium", prompt: "Choose dynamic, predictive, or scheduled scaling for: (a) a payroll app on the 1st and 15th, (b) a viral campaign, (c) a daily commuter app." },
      { difficulty: "Medium", prompt: "Write ALB path rules to send `/api/*` to one target group and everything else to another." },
      { difficulty: "Hard", prompt: "Design a stateless login flow so any instance can serve any user. Where does the session live?" },
      { difficulty: "Easy", prompt: "Match each to ALB, NLB or GWLB: a multiplayer game server over UDP, a fleet of third-party firewalls, a website routing /blog and /shop to different services." },
      { difficulty: "Medium", prompt: "An instance in your group is running but its web server has crashed, and it is never replaced. Explain why and what setting fixes it." },
    ],
    interviewQuestions: [
      { question: "Difference between EC2 Auto Scaling and ELB?", answer: "Auto Scaling changes how many instances exist; ELB distributes traffic across them and checks their health." },
      { question: "When use an NLB over an ALB?", answer: "When you need layer 4 handling, extreme performance, or static IP addresses; use an ALB for HTTP-aware routing." },
      { question: "What is predictive scaling?", answer: "Forecasting load from historical patterns and scaling capacity ahead of time." },
      { question: "Exam-style: Which service automatically adds EC2 instances when demand rises?", answer: "Amazon EC2 Auto Scaling." },
      { question: "Exam-style: Which load balancer routes traffic based on URL path?", answer: "Application Load Balancer." },
      { question: "Exam-style: Which load balancer provides a static IP address per Availability Zone and handles millions of requests per second?", answer: "Network Load Balancer." },
      { question: "Exam-style: Which load balancer is used to deploy and scale third-party virtual firewall appliances?", answer: "Gateway Load Balancer." },
      { question: "Exam-style: Which feature is mainly about cost, and which mainly about availability: Auto Scaling or ELB?", answer: "Auto Scaling matches capacity to demand (cost and capacity); ELB distributes traffic across healthy targets in multiple AZs (availability)." },
      { question: "What happens if you terminate an instance that belongs to an Auto Scaling group?", answer: "The group sees it is below desired capacity and launches a replacement. To stop the instances, change the group's capacity or delete the group." },
    ],
    prerequisites: ["ec2-basics", "aws-global-infrastructure"],
    relatedTopics: ["vpc-networking", "monitoring-and-auditing", "ec2-pricing", "well-architected-framework", "load-balancing", "scalability"],
    keywords: ["auto scaling", "elb", "alb", "nlb", "gwlb", "target group", "health check", "elasticity", "launch template", "desired capacity", "listener", "deregistration delay", "connection draining", "scale-in protection", "geneve", "classic load balancer", "acm"],
  },

  {
    id: "messaging-sqs-sns",
    title: "Messaging: SQS, SNS and EventBridge",
    level: "intermediate",
    description: "Decouple components with queues and publish/subscribe topics so one failure does not cascade.",
    explanation: md(
      "In a **tightly coupled** design, service A calls service B and waits. If B is slow or down, A suffers. In a **loosely coupled** design, A leaves a message somewhere durable and moves on; B picks it up when it can.",
      "- **Amazon SQS** (Simple Queue Service): a managed **queue**. Producers send messages; consumers poll, process and delete them. Messages are stored until processed. *Standard* queues: very high throughput, at-least-once delivery, best-effort order. *FIFO* queues: ordering and exactly-once processing, lower throughput. A **dead-letter queue** collects messages that keep failing.\n- **Amazon SNS** (Simple Notification Service): **publish/subscribe**. A publisher sends one message to a *topic*, and SNS pushes a copy to every subscriber (SQS queues, Lambda, HTTPS endpoints, email, SMS, mobile push).\n- **Amazon EventBridge**: an event bus that routes events from AWS services, SaaS apps and your code to targets by rules, with schedules and filtering.",
      "SNS plus SQS gives **fan-out**: one event, many independent queues, each processed at its own pace.",
      "The exam groups messaging into three patterns:",
      "- **Queuing (SQS)**: consumers *pull* messages; each is processed, then deleted. Not real-time. Classic use: hand off slow background work (a sign-up or password-reset email) so the web request returns fast.\n- **Pub/sub (SNS)**: SNS *pushes* each message at once to all subscribers. Publishers don't know who subscribes, and filter policies let each subscriber get only what it wants. SNS retries failed deliveries but does not store messages for later.\n- **Streaming (Amazon Kinesis Data Streams)**: producers write events into a stream split into shards. Many consumers can read the *same* events, which are kept for a retention period and can be replayed. Used for real-time analytics, clickstreams and IoT data; costs more than simple queuing.",
      "SNS also carries notifications for other AWS services: CloudWatch alarms and AWS Budgets alerts usually email through an SNS topic. SNS email is plain text, meant for internal or operational alerts, not polished customer email.",
      "Fun fact from some study material: SQS was the first AWS service to launch, in 2004.",
    ),
    analogy:
      "A queue is a ticket spindle in a repair shop: customers pin job slips, and any free mechanic grabs the next one. Slips wait safely if everyone is busy. A topic is a notice-board announcement: one note, and every team that signed up gets its own copy.",
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
      "SQS stores each message redundantly across AZs. When a consumer receives it, the message is hidden for a *visibility timeout*; the consumer deletes it when done. If the consumer crashes, the timeout expires and the message is retried. After a set number of failed receives, it moves to the dead-letter queue.",
      "SNS delivers each message to all subscriptions, with retries and optional filter policies. EventBridge matches events against rule patterns and forwards matches to targets.",
    ),
    diagram: `  Producer --> [ SNS topic ] --+--> [ SQS billing ]  --> Billing workers
                               +--> [ SQS shipping ] --> Shipping workers
                               +--> Lambda (audit)
  Failed 3x ... --> [ Dead-letter queue ]`,
    whyItExists: md(
      "Direct calls tie components' availability and speed together. Messaging absorbs bursts, hides slow consumers, allows retries, and lets teams change one part without breaking others.",
    ),
    whenToUse: md(
      "- SQS: buffer work (image processing, order handling).\n- SNS: notifications and fan-out.\n- EventBridge: event-driven integrations across services and SaaS, rule-based routing, scheduled events.",
    ),
    whenNotToUse: md(
      "If the caller needs an immediate answer (a login check), use a synchronous call. For high-volume streaming analytics with replay, use a streaming service such as Kinesis instead of a queue.",
    ),
    commonMistakes: [
      "Assuming Standard SQS never delivers a message twice - consumers must be idempotent.",
      "Visibility timeout shorter than the processing time, causing duplicate work.",
      "No dead-letter queue, so poison messages loop forever.",
      "Using SNS when you need buffering for a slow consumer (add an SQS queue behind it).",
      "Forgetting the access policy that lets SNS write into an SQS queue.",
      "Mixing up the patterns: SQS = pull and queue, SNS = push and notify, Kinesis = real-time stream that several consumers can replay.",
      "Using SNS email subscriptions to send marketing or transactional email to customers.",
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
      { question: "Exam-style: Which service ingests real-time clickstream data so several applications can read the same records?", answer: "Amazon Kinesis Data Streams." },
      { question: "Exam-style: A CloudWatch billing alarm needs to email the finance team. Which service delivers the email?", answer: "Amazon SNS, through a topic with an email subscription." },
      { question: "Is SQS push or pull?", answer: "Pull: consumers poll the queue. SNS is the push-based service." },
    ],
    prerequisites: ["ec2-basics"],
    relatedTopics: ["serverless-and-containers", "auto-scaling-and-load-balancing", "queues", "scalability"],
    keywords: ["sqs", "sns", "eventbridge", "queue", "pub/sub", "fan-out", "decoupling", "dead letter", "event driven", "message", "kinesis data streams", "streaming", "shards", "pull", "push", "fifo", "visibility timeout"],
  },

  {
    id: "serverless-and-containers",
    title: "Serverless and Containers",
    level: "intermediate",
    description: "Lambda, ECS, EKS and Fargate: running code without managing servers, and choosing the right compute.",
    explanation: md(
      "**Serverless** does not mean no servers. It means *you* don't provision, patch or scale them. You provide code; the service runs it when needed and bills for use.",
      "**AWS Lambda** runs a function in response to events (an HTTP request, a queue message, a file upload, a schedule). You pay per invocation and duration, it scales automatically, and each run is short. Limits apply, such as a 15-minute maximum run time and configurable memory, so long, heavy jobs belong elsewhere.",
      "**Containers** package an app with its dependencies so it runs the same everywhere.",
      "- **Amazon ECS**: AWS's own container orchestrator, simple and tightly integrated.\n- **Amazon EKS**: managed Kubernetes, for teams that want the Kubernetes API and ecosystem.\n- **AWS Fargate**: serverless compute for containers. You set CPU and memory; it runs tasks without EC2 hosts for you to manage (works with ECS and EKS).\n- **Amazon ECR** (Elastic Container Registry): a managed registry to store, scan and share container images for ECS, EKS and Fargate.",
      "**More compute options**",
      "- **AWS Batch**: runs batch jobs at any scale. You submit jobs; Batch queues them and provisions the right EC2 or Fargate capacity (including Spot), so you don't manage a scheduler.\n- **Amazon Lightsail**: simple virtual servers, containers, databases, storage and static IPs with predictable monthly pricing and a friendly console. Good for small websites, blogs and learning projects.\n- **AWS Outposts**: AWS infrastructure and services in your own data center for hybrid needs.",
      "**Choosing compute**:",
      "- EC2: full control of virtual servers.\n- Containers (ECS/EKS/Fargate): portable, packaged applications.\n- Lambda: short, event-driven code.\n- Elastic Beanstalk: deploy web apps without managing infrastructure details.\n- Lightsail: a simple fixed-price start.",
      "**Virtual machines vs containers**",
      "- A **VM** runs on a hypervisor with its own full guest OS. You usually size it with spare headroom that you pay for even when unused. Apps sharing one VM are not isolated: one can hog resources or break another's configuration.\n- A **container** runs on a container runtime (such as Docker Engine) and shares the host's OS kernel. Each bundles its own libraries and dependencies, is isolated from its neighbours, packs more densely and starts much faster than a VM.",
      "**Docker** popularised containers: a *Dockerfile* describes how to build an image, *Docker Compose* runs multi-container apps, and *Docker Hub* is a public image registry. The **Open Container Initiative (OCI)** standardises image formats and runtimes, so OCI images run with any compatible tool.",
      "**Kubernetes** (K8s) is the open-source orchestration standard, originally from Google and now run by the CNCF. It runs containers across many nodes in *pods* (one or more containers sharing network and storage) and shines with many microservices. **Bottlerocket** is AWS's open-source Linux OS built just for hosting containers.",
      "**Monolith vs microservices**: a monolith is one tightly coupled app doing everything. Microservices split it into small, independently deployable (often stateless) services, each doing one job, often built from managed pieces such as containers, Lambda, SQS, ELB and RDS.",
      "**ECS building blocks**",
      "- A **cluster** provides capacity: Fargate, EC2 instances you manage, or a mix through *capacity providers*.\n- A **task definition** is the blueprint: image, CPU and memory, ports and IAM roles.\n- A **task** runs containers until they finish (good for one-off jobs). A **service** keeps a desired number of tasks running long term, such as a web server, and replaces failed ones using health checks.\n- Images come from Amazon ECR or a public registry such as Docker Hub. Container logs normally go to CloudWatch Logs.",
      "Cost trap: an ECS cluster on EC2 instances bills for them all the time, even with no tasks running (the upside: no cold start). A Fargate-only cluster with nothing running costs nothing, because Fargate bills for the vCPU and memory running tasks request.",
      "**Lambda details**: you pick a runtime (Node.js, Python, Java, .NET, Ruby, Go, or a custom runtime), memory and a timeout. Billing is requests plus duration, measured in **1 ms increments** (older material says 'rounded up to 100 ms'; that changed in December 2020).",
      "Edit small functions in the console's built-in VS Code-based editor. Upload bigger ones as a .zip file, from S3, or as a **container image**. Test by sending a JSON test event and reading the output in CloudWatch Logs. For longer-running serverless container work, use Fargate.",
      "**Other container helpers**:",
      "- **AWS App Runner**: deploys containerised web apps and APIs from an image or source code, with no underlying resources for you to see (unlike Elastic Beanstalk, which shows the EC2 instances and load balancer it creates).\n- **AWS Step Functions**: orchestrates Lambda functions and ECS/Fargate tasks as state machines.\n- **AWS X-Ray**: traces requests across microservices.",
      "**Serverless is a spectrum**, not a yes/no. Typical traits: high elasticity and availability, durable, secure by default, no infrastructure to see, **scale to zero** (no cost when idle), and paying for value instead of idle servers. Services often called serverless: Lambda, Fargate, S3, DynamoDB, Aurora Serverless, Step Functions, API Gateway, AppSync, Amplify, SQS and SNS.",
    ),
    analogy:
      "EC2 is renting a whole kitchen: full control, but you clean and maintain it. Containers are meal-prep boxes you can reheat in any kitchen. Lambda is ordering one dish from a ghost kitchen: it appears when you ask, and you pay just for that dish.",
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
      "When an event arrives, Lambda finds or creates an execution environment, loads your code and runs the handler. The first call in a new environment has a *cold start* delay. Lambda scales out by adding environments. You pay for requests and run time.",
      "ECS and EKS schedule containers onto capacity. With the EC2 launch type you manage the hosts; with Fargate AWS supplies capacity per task.",
    ),
    diagram: `  Event (HTTP, S3, SQS, schedule)
          |
          v
  [ Lambda ] -- scales per event, short-lived

  Container image (ECR) --> [ ECS or EKS ] --> capacity:
                                   |-- EC2 hosts you manage
                                   '-- Fargate (managed)`,
    whyItExists: md(
      "Managing servers is undifferentiated work. Serverless and managed containers let teams focus on code, scale to zero when idle, and pay for useful work instead of idle hosts.",
    ),
    whenToUse: md(
      "- Lambda: APIs, glue code, file processing, scheduled jobs, event handlers.\n- Containers: long-running services, portable workloads, microservices.\n- Fargate: containers without hosts to manage.",
    ),
    whenNotToUse: md(
      "Avoid Lambda for jobs longer than its time limit, steady heavy compute where reserved servers cost less, or workloads needing a special OS or hardware. Skip EKS if your team doesn't need Kubernetes; ECS is simpler.",
    ),
    commonMistakes: [
      "Treating Lambda as stateful - local memory and disk do not persist reliably between invocations.",
      "Giving the function an over-broad IAM role.",
      "Ignoring cold-start impact on latency-sensitive paths.",
      "Choosing Kubernetes for a handful of services without needing it.",
      "Forgetting that unbounded Lambda concurrency can overwhelm a downstream database.",
      "Running an ECS cluster on EC2 instances for an occasional job and paying for idle instances; Fargate charges nothing when no tasks run.",
      "Creating an ECS *service* for a container that prints something and exits; that is a one-off *task*.",
      "Reaching for containers or Kubernetes when a single EC2 instance or a Lambda function would be simpler.",
      "Believing containers each need their own full OS like VMs; they share the host kernel.",
      "Using Batch for a latency-sensitive web request path; it is for queued, asynchronous jobs.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Run the handler example here and change the event to include a different name." },
      { difficulty: "Medium", prompt: "Decide between Lambda, Fargate, and EC2 for: nightly 30-minute ETL, image thumbnailing on upload, a Windows legacy app." },
      { difficulty: "Medium", prompt: "Explain the difference between ECS on EC2 and ECS on Fargate in terms of who patches the hosts." },
      { difficulty: "Hard", prompt: "A Lambda connected to a relational database causes connection exhaustion at peak. Propose two mitigations." },
      { difficulty: "Easy", prompt: "List three differences between a virtual machine and a container." },
      { difficulty: "Medium", prompt: "Write down the ECS task definition settings you would need for a small web container, and decide whether it should run as a task or a service." },
    ],
    interviewQuestions: [
      { question: "What is AWS Lambda?", answer: "A serverless compute service that runs code in response to events and bills by invocations and duration, scaling automatically." },
      { question: "ECS vs EKS?", answer: "ECS is AWS's proprietary orchestrator; EKS is managed Kubernetes. EKS suits teams that want Kubernetes portability and tooling." },
      { question: "What does Fargate remove?", answer: "The need to provision and manage the underlying servers for your containers." },
      { question: "Exam-style: A company wants to run code without managing servers, only when an event occurs. Which service? ", answer: "AWS Lambda." },
      { question: "Exam-style: Which service stores Docker container images?", answer: "Amazon Elastic Container Registry (ECR)." },
      { question: "Exam-style: Which service is best for a small business that wants a simple WordPress site with predictable monthly cost?", answer: "Amazon Lightsail." },
      { question: "Which service runs queued batch computing jobs without you managing a scheduler?", answer: "AWS Batch." },
      { question: "Exam-style: A team already runs Kubernetes on premises and wants a managed equivalent on AWS. Which service?", answer: "Amazon EKS." },
      { question: "Exam-style: Which service runs containers without provisioning or patching servers, and works with both ECS and EKS?", answer: "AWS Fargate." },
      { question: "How is Lambda billed?", answer: "By the number of requests plus duration (memory allocated multiplied by run time), measured in 1 ms increments." },
      { question: "Why might an ECS cluster cost money when no containers are running?", answer: "If it uses the EC2 launch type, you pay for the EC2 instances the whole time. With Fargate you pay only for running tasks." },
      { question: "Task vs service in ECS?", answer: "A task runs containers once until they exit; a service keeps a desired number of tasks running and replaces failed ones." },
      { question: "Exam-style: Which service orchestrates several Lambda functions into a workflow with retries and branching?", answer: "AWS Step Functions." },
    ],
    prerequisites: ["ec2-basics", "iam-basics"],
    relatedTopics: ["messaging-sqs-sns", "auto-scaling-and-load-balancing", "migration-and-innovation", "scalability"],
    keywords: ["lambda", "serverless", "ecs", "eks", "fargate", "ecr", "container", "kubernetes", "cold start", "event driven", "aws batch", "lightsail", "outposts", "elastic beanstalk", "docker", "oci", "pod", "task definition", "microservices", "monolith", "app runner", "step functions", "x-ray", "bottlerocket", "virtual machine", "scale to zero"],
  },

  {
    id: "vpc-networking",
    title: "VPC Networking",
    level: "intermediate",
    description: "Your private network in AWS: subnets, internet and NAT gateways, VPN, and Direct Connect.",
    explanation: md(
      "An **Amazon VPC** (Virtual Private Cloud) is an isolated network you define inside a Region. You pick its IP range in **CIDR** notation (for example `10.0.0.0/16`) and split it into **subnets**, each in a single AZ.",
      "- **Public subnet**: has a route to an **Internet Gateway (IGW)**, so resources with public IPs can reach the internet and be reached from it.\n- **Private subnet**: no direct route from the internet; ideal for databases and app servers.\n- **NAT gateway**: lets private resources open outbound connections (updates, APIs) without accepting inbound ones. It lives in a public subnet.\n- **Route tables**: decide where a subnet's traffic goes.\n- **Virtual private gateway + Site-to-Site VPN**: an encrypted tunnel over the internet to your on-premises network.\n- **AWS Direct Connect**: a dedicated private connection from your site to AWS, steadier than the internet.",
      "Other connectors: **VPC peering** (connect two VPCs), **Transit Gateway** (a hub for many VPCs and networks), and **VPC endpoints** (reach AWS services privately, without the internet).",
      "**Scope and sizing**: a VPC belongs to one Region. Each subnet sits in exactly one AZ, which is how you choose an EC2 instance's AZ. In CIDR, a *bigger* suffix means a *smaller* range: `/16` holds 65,536 addresses, `/24` holds 256, `/32` is one IPv4 address and `/0` is every address. A subnet's range must fit inside its VPC's range.",
      "AWS doesn't enforce 'public' or 'private'; the words describe a subnet's routing. To make a subnet public:",
      "- Create an internet gateway and attach it to the VPC.\n- Add a route `0.0.0.0/0 -> IGW` to the subnet's route table.\n- Give instances public IPs, for example by turning on auto-assign public IPv4 for the subnet.",
      "A brand-new route table has only the `local` route.",
      "**Hybrid connectivity options**",
      "- **AWS Site-to-Site VPN**: connects an office or data center network to a VPC.\n- **AWS Client VPN**: connects individual users (remote employees) to AWS or on-premises networks.\n- Both build encrypted tunnels over the internet with **IPsec**, a protocol suite that authenticates and encrypts IP packets.\n- **AWS Direct Connect**: a dedicated private line from your data center, office or a colocation facility (a shared data center where you rent space and bandwidth) into AWS, bypassing the public internet. Higher, steadier bandwidth, lower latency, and possibly lower data transfer costs. Lower-bandwidth *hosted* connections come through AWS partners; higher-bandwidth *dedicated* ones come straight from AWS.\n- **AWS PrivateLink** (interface VPC endpoints): reach AWS or partner services from your VPC without crossing the public internet.",
      "Exam trap: Direct Connect is **private but not encrypted by default**. If you need encryption, run a Site-to-Site VPN over it, or use MACsec on supported connections.",
      "Practical notes: resource 'names' in the console are just the `Name` tag. Many managed services (S3, DynamoDB, Lambda by default) run in AWS-managed networks, so you don't pick a VPC for them. You can't delete a VPC while instances still run in it.",
    ),
    analogy:
      "A VPC is a gated campus. The main gate (internet gateway) opens onto a public plaza (public subnet) with reception and a cafe. Behind it are private office buildings (private subnets) with no street entrance. Staff leave through a controlled side door (NAT), but strangers can't walk in. A private tunnel to head office is the VPN; a dedicated road is Direct Connect.",
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
      "Every packet leaving a subnet is matched against its **route table**; the most specific route wins. `local` routes keep traffic inside the VPC. A route to an IGW makes a subnet public (instances also need a public or Elastic IP).",
      "A route to a NAT gateway lets private instances start outbound traffic. The NAT swaps their private addresses for its own public one and passes replies back.",
      "For on-premises links, a VPN is quick to set up and encrypted over the internet. Direct Connect takes longer but gives a private, steadier link. Many designs use both: Direct Connect primary, VPN backup.",
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
      "Early cloud servers sat on flat shared networks. A VPC gives you your own network design (address ranges, routing, segmentation), so you expose only what must be public and isolate the rest.",
    ),
    whenToUse: md(
      "Every workload on EC2, RDS and many other services lives in a VPC. Use public subnets for load balancers, private subnets for apps and data, NAT for outbound access, and VPN or Direct Connect for hybrid.",
    ),
    whenNotToUse: md(
      "Don't put databases in public subnets 'for convenience'. Don't pick Direct Connect for a quick proof of concept (it has lead time); start with VPN. Skip NAT gateways for AWS service traffic when a VPC endpoint keeps it private and cheaper.",
    ),
    commonMistakes: [
      "Overlapping CIDR ranges that block later VPC peering or VPN connectivity.",
      "Choosing a /16 everywhere without planning, or a range too small to grow.",
      "Placing a single NAT gateway in one AZ and losing outbound access if that AZ fails.",
      "Forgetting the route table association, so the subnet is not actually public.",
      "Believing Direct Connect is encrypted by default (it is private, not automatically encrypted).",
      "Reading CIDR backwards: a /24 is much smaller than a /16, and /0 means all addresses, not one (a single address is /32).",
      "Naming a subnet 'public' and expecting it to work without an IGW route and public IPs.",
      "Mixing up Site-to-Site VPN (whole networks) and Client VPN (individual users).",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain why a subnet with an IGW route is called public and what else an instance needs to be reachable." },
      { difficulty: "Medium", prompt: "Use the CIDR calculator to split 10.0.0.0/16 into six /24 subnets without overlap." },
      { difficulty: "Medium", prompt: "Draw the route tables for public, private, and data subnets." },
      { difficulty: "Hard", prompt: "Design connectivity from an office to AWS needing high reliability. Combine Direct Connect and VPN and describe failover." },
      { difficulty: "Easy", prompt: "Without a calculator: which is larger, 10.0.0.0/16 or 10.0.5.0/24? How many addresses does a /32 cover?" },
      { difficulty: "Medium", prompt: "Choose Site-to-Site VPN, Client VPN, Direct Connect or PrivateLink for: 200 remote staff, a branch office, a steady multi-gigabit data feed, private access to a partner's SaaS API." },
    ],
    interviewQuestions: [
      { question: "What makes a subnet public?", answer: "A route to an Internet Gateway in its route table (plus public IP addressing for the resources)." },
      { question: "NAT gateway purpose?", answer: "Allows instances in private subnets to initiate outbound connections to the internet while preventing inbound connections from it." },
      { question: "VPN vs Direct Connect?", answer: "A VPN is an encrypted tunnel over the public internet, quick to set up; Direct Connect is a dedicated private connection with more consistent latency and bandwidth." },
      { question: "Exam-style: Which component allows internet access for a public subnet?", answer: "An Internet Gateway." },
      { question: "Exam-style: A company needs a private, dedicated link between its data center and AWS. Which service?", answer: "AWS Direct Connect." },
      { question: "Exam-style: Remote employees need secure access to resources in a VPC from their laptops. Which service?", answer: "AWS Client VPN." },
      { question: "Exam-style: How do you encrypt traffic that travels over AWS Direct Connect?", answer: "Run an AWS Site-to-Site VPN (IPsec) over the Direct Connect link, or use MACsec where supported. Direct Connect alone is not encrypted." },
      { question: "Exam-style: Which service lets a VPC reach AWS or partner services privately without using the public internet?", answer: "AWS PrivateLink (interface VPC endpoints)." },
      { question: "Is a VPC global, regional or zonal? What about a subnet?", answer: "A VPC is regional; a subnet lives in a single Availability Zone." },
    ],
    prerequisites: ["aws-global-infrastructure", "ec2-basics"],
    relatedTopics: ["network-security", "dns-and-cdn", "auto-scaling-and-load-balancing", "aws-databases"],
    keywords: ["vpc", "subnet", "cidr", "internet gateway", "nat gateway", "route table", "vpn", "direct connect", "transit gateway", "peering", "site-to-site vpn", "client vpn", "ipsec", "privatelink", "vpc endpoint", "macsec", "colocation", "public subnet", "private subnet"],
  },

  {
    id: "network-security",
    title: "Network Security: Security Groups and NACLs",
    level: "intermediate",
    description: "Two firewall layers in a VPC: stateful security groups on resources and stateless network ACLs on subnets.",
    explanation: md(
      "AWS gives you two built-in packet filters inside a VPC:",
      "- **Security group (SG)**: attached to an instance's network interface. **Stateful**: if a request is allowed in, its reply is allowed out automatically, and vice versa. Only *allow* rules exist; anything not allowed is denied.\n- **Network ACL (NACL)**: attached to a subnet. **Stateless**: inbound and outbound are judged separately, so you must also allow return traffic (usually ephemeral ports). Has *allow* and *deny* rules, checked in number order.",
      "**Defaults**: a new security group denies all inbound and allows all outbound. The *default* NACL of a default VPC allows all traffic both ways; a NACL you create starts by denying everything.",
      "Security groups can use *other security groups* as sources, so you can say 'the app tier may talk to the database tier' without hard-coding IPs.",
      "Exam favourite: **to block one specific IP address, use a NACL**. Security groups can't deny, so they can't block a single address. NACL rules target CIDR ranges: `/32` is exactly one IPv4 address, `/0` is all addresses.",
      "More details:",
      "- NACL rules are checked from the lowest number up; the first match wins. Leave gaps (100, 150, 200) so you can slot rules in later.\n- A NACL applies to everything in its subnet, never one instance. Each subnet uses the VPC's default NACL unless you associate another.\n- Security group rules name a protocol and port (SSH 22, HTTP 80, HTTPS 443, PostgreSQL 5432) and a source (a CIDR range, 'My IP', or another security group).\n- Every VPC has a default security group that can't be deleted. A group referenced by another group can't be deleted until the reference is removed.",
    ),
    analogy:
      "A subnet's NACL is the guard at a building's front desk who checks everyone in and everyone out against a list, treating each direction separately. A security group is the receptionist at each company's door who remembers 'I invited this visitor', so no re-check is needed when they leave.",
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
        explanation: "Rule 120 never matches traffic already allowed by rule 100 or 110, because NACL rules run in number order. Give specific denies lower numbers than broad allows.",
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
      "Follow one request: a client sends HTTPS to a web server in a subnet. It first meets the **subnet's NACL inbound rules**. If allowed, it reaches the instance's **security group** inbound rules.",
      "The reply skips the security group's outbound check (it is tracked as part of the connection). It must still pass the **NACL outbound rules**, because NACLs don't track connections.",
      "NACLs are blunt (per subnet, IP/port based), so most daily control uses security groups. NACLs are an extra layer, handy for blocking an IP range at the subnet edge.",
    ),
    diagram: `  client --> [ NACL in ] --> [ SG in ] --> instance
  client <-- [ NACL out ] <-- (reply auto-allowed by SG)
              ^ stateless: needs its own rule`,
    whyItExists: md(
      "Defense in depth: one mistake shouldn't expose everything. Instance-level and subnet-level filters give layered protection: SGs for precise allow-lists, NACLs for coarse allow/deny at the boundary.",
    ),
    whenToUse: md(
      "Use security groups on every resource, with tight sources. Use NACLs when you need explicit denies or a coarse subnet-level guard.",
    ),
    whenNotToUse: md(
      "Don't rely on a NACL alone to protect instances. Don't open `0.0.0.0/0` on admin ports like SSH or RDP; use Systems Manager Session Manager or a bastion with restricted sources.",
    ),
    commonMistakes: [
      "Forgetting ephemeral-port return rules in a NACL and wondering why connections hang.",
      "Expecting a security group to support deny rules.",
      "Opening port 22 or 3389 to the world.",
      "Misordering NACL rule numbers so a broad allow shadows a specific deny.",
      "Hard-coding IPs where a security group reference would follow the instances automatically.",
      "Trying to block an attacker's IP with a security group; you need a NACL deny rule (or AWS WAF for web traffic).",
      "Writing `/0` when you mean a single address; one IPv4 address is `/32`.",
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
      { question: "Exam-style: A company must block traffic from one malicious IP address to all instances in a subnet. What should it use?", answer: "A network ACL deny rule for that address as a /32." },
      { question: "In what order are NACL rules evaluated?", answer: "By rule number, lowest first; the first matching rule decides, and a final implicit rule denies everything else." },
    ],
    prerequisites: ["vpc-networking"],
    relatedTopics: ["iam-basics", "security-services", "shared-responsibility-model", "ec2-basics"],
    keywords: ["security group", "nacl", "network acl", "stateful", "stateless", "firewall", "ingress", "egress", "ephemeral ports", "block ip", "/32", "rule number", "default security group"],
  },

  {
    id: "dns-and-cdn",
    title: "DNS and CDN: Route 53 and CloudFront",
    level: "intermediate",
    description: "Translate names to addresses with Route 53, and serve content from edge locations with CloudFront.",
    explanation: md(
      "**DNS** (Domain Name System) turns a name like `www.example.com` into an IP address. A resolver asks a chain of servers (the root, then the top-level domain `.com`, then the domain's **authoritative** name server) and caches the answer for the record's **TTL**.",
      "**Amazon Route 53** is AWS's DNS service. It registers domains, hosts DNS zones and health-checks endpoints. Its **routing policies** decide which answer to return:",
      "- **Simple**: one answer.\n- **Weighted**: split traffic by percentage (canary releases).\n- **Latency-based**: send users to the Region with the lowest latency.\n- **Failover**: primary/secondary, switching on failed health checks.\n- **Geolocation / Geoproximity**: route by where the user or resource is.\n- **Multivalue answer**: return several healthy records.",
      "**Amazon CloudFront** is a **content delivery network (CDN)**. It caches your content (static files, video, even API responses) in **edge locations** near users. It fetches from your **origin** (S3, an ALB, any HTTP server) only on a cache miss. It also handles TLS termination, absorbs DDoS traffic and integrates with AWS WAF.",
      "**Regional edge caches** sit between the origin and edge locations. These larger caches hold less popular content, so fewer requests go all the way back to the origin.",
      "**CloudFront features to know**",
      "- **Distribution**: the CloudFront configuration. It can have several origins (and origin groups for failover) and custom error pages. Changes take a while to deploy worldwide.\n- **Behaviors**: per-path settings, such as the protocol policy (for example redirect HTTP to HTTPS) and how long content stays cached.\n- **Invalidations**: remove cached files (such as `/image.jpg`) so the next request gets a fresh copy from the origin.\n- **Geographic restrictions**: an allow list or block list of countries.\n- **Code at the edge**: **CloudFront Functions** run lightweight JavaScript at edge locations. **Lambda@Edge** is more powerful and can read and change requests and responses. Both cut latency compared with calling a Lambda function in one Region.",
      "**Other services that use edge locations**",
      "- **AWS Global Accelerator**: users enter the AWS network at the nearest edge location, then travel over the AWS backbone to your app. It improves performance and availability for global users (for example a single-Region app with worldwide customers, or non-HTTP traffic) without building in other Regions. It does not cache.\n- **Amazon S3 Transfer Acceleration**: a special bucket endpoint. Distant users upload to a nearby edge location, and the data then rides the AWS backbone to the bucket.",
      "Exam tip: services with 'accelerat' in the name use edge locations as an **on-ramp** into AWS. CloudFront uses them as an **off-ramp**, delivering cached content to users.",
    ),
    analogy:
      "DNS is a phone book you check before every call. A CDN is a chain of local libraries holding copies of popular books, so most readers borrow from the branch around the corner instead of ordering from a central archive across the world.",
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
      "A browser asks its resolver for your name's address. Route 53, as the authoritative server, applies the routing policy and health checks and returns an answer. The resolver caches it until the TTL expires, and the browser connects to that address.",
      "With CloudFront, the name resolves to a nearby edge location. If the edge has a fresh copy, it responds at once (a *cache hit*). Otherwise it fetches from the origin, stores the result according to cache headers and policies, and responds. You can invalidate cached objects when content changes.",
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
      "People remember names, computers use numbers, and DNS bridges them. Distance adds latency, and the speed of light is fixed; copying content near users is the only way to make far-away users feel close.",
    ),
    whenToUse: md(
      "Use Route 53 for domains, failover and traffic shifting. Use CloudFront for global static assets, media streaming, speeding up dynamic sites and shielding origins from load.",
    ),
    whenNotToUse: md(
      "A CDN adds little when your audience is in one place next to the origin, or when content is unique per request and can't be cached. Very low TTLs everywhere raise DNS query cost and latency.",
    ),
    commonMistakes: [
      "Setting a long TTL, then needing to repoint quickly during an incident.",
      "Caching personalised responses by accident.",
      "Forgetting that DNS changes are not instant because of resolver caching.",
      "Using a CNAME at the zone apex (use a Route 53 alias record).",
      "Not setting cache headers, so CloudFront cannot cache effectively.",
      "Updating a file at the origin and expecting users to see it at once; cached copies stay until they expire or you create an invalidation.",
      "Choosing CloudFront for faster uploads into S3 from far away; that is S3 Transfer Acceleration.",
      "Thinking Global Accelerator caches content like CloudFront; it only routes traffic over the AWS network.",
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
      { question: "Exam-style: Users around the world upload large files to one S3 bucket and uploads are slow. What helps?", answer: "Amazon S3 Transfer Acceleration." },
      { question: "Exam-style: A single-Region application with global users, including non-HTTP traffic, needs better performance and availability via the AWS network. Which service?", answer: "AWS Global Accelerator." },
      { question: "How do you make CloudFront serve an updated file immediately?", answer: "Create an invalidation for that path so edge locations fetch the new version from the origin." },
      { question: "CloudFront Functions vs Lambda@Edge?", answer: "Both run code close to users. CloudFront Functions are lightweight JavaScript for simple, high-volume request tweaks; Lambda@Edge is more powerful and can work with both requests and responses." },
      { question: "Exam-style: How can a company stop users in certain countries from accessing content served by CloudFront?", answer: "Use CloudFront geographic restrictions (an allow list or block list of countries)." },
    ],
    prerequisites: ["aws-global-infrastructure", "vpc-networking"],
    relatedTopics: ["block-file-object-storage", "security-services", "auto-scaling-and-load-balancing", "cdn", "caching"],
    keywords: ["dns", "route 53", "cloudfront", "cdn", "edge", "ttl", "routing policy", "alias", "cache", "origin", "regional edge cache", "invalidation", "lambda@edge", "cloudfront functions", "global accelerator", "s3 transfer acceleration", "geo restriction", "behavior", "distribution"],
  },

  {
    id: "block-file-object-storage",
    title: "Block, File and Object Storage",
    level: "intermediate",
    description: "Instance store, EBS, EFS and S3: choosing a storage type, S3 classes, lifecycle rules, durability and availability.",
    explanation: md(
      "AWS offers three storage shapes:",
      "- **Block storage** (like a raw disk): **Amazon EBS** volumes attach to one EC2 instance in the same AZ (some types support multi-attach) and persist on their own. **Instance store** is disk physically attached to the host: very fast, but data is lost when the instance stops or terminates. **EBS snapshots** are incremental backups in S3-backed storage; you can copy them across Regions.\n- **File storage**: **Amazon EFS** is a managed, elastic NFS file system for Linux that many instances can mount at once across AZs. Related options include FSx for Windows and other file systems.\n- **Object storage**: **Amazon S3** stores objects (data + metadata) in *buckets* at unlimited scale, over HTTP APIs. It is not a drive you mount.",
      "**S3 storage classes** trade retrieval speed and access frequency for price:",
      "- **S3 Standard**: frequent access.\n- **S3 Express One Zone**: very low latency in a single AZ, for performance-critical data.\n- **S3 Intelligent-Tiering**: moves objects between tiers automatically when patterns are unknown.\n- **S3 Standard-IA** and **One Zone-IA**: infrequent access, lower storage price, retrieval fee.\n- **S3 Glacier Instant Retrieval**: archive with millisecond access.\n- **S3 Glacier Flexible Retrieval**: archive, retrieval in minutes to hours.\n- **S3 Glacier Deep Archive**: cheapest, retrieval within hours (long-term retention).",
      "**Lifecycle rules** move or expire objects automatically. S3 **durability** is designed for eleven nines (99.999999999%): data is very unlikely to be lost. That differs from **availability** (can you read it right now), which varies by class.",
      "**More storage and data-protection services**",
      "- **Amazon FSx**: fully managed third-party file systems: FSx for Windows File Server (SMB), FSx for Lustre (high-performance computing), FSx for NetApp ONTAP and FSx for OpenZFS.\n- **AWS Storage Gateway**: hybrid service connecting on-premises apps to AWS storage through File, Volume or Tape Gateway types, with local caching.\n- **AWS Backup**: one place to set backup policies and schedules across EC2, EBS, RDS, DynamoDB, EFS, FSx and more, with cross-Region and cross-account copy.\n- **AWS Elastic Disaster Recovery (DRS)**: continuously replicates servers to a low-cost staging area in AWS and launches them quickly after a disaster.\n- **AWS Transfer Family**: managed SFTP, FTPS and FTP endpoints that read and write to S3 or EFS, so partners keep their file-transfer clients.",
      "**Choosing by access pattern**:",
      "- A virtual disk for one server: block (EBS).\n- A shared drive many servers read and write at once, with file locking, over NFS or SMB: file (EFS, FSx).\n- Upload and serve files over HTTPS with no infrastructure to manage: object (S3).",
      "Object storage has no file locking and isn't meant to be mounted as an OS drive or used for high-IOPS work.",
      "**S3 fundamentals**",
      "- An object is a **key** (its name), the **value** (the bytes), a **version ID** when versioning is on, and **metadata**. Console 'folders' are just key prefixes.\n- **Bucket names are globally unique**, like domain names, though each bucket lives in one Region.\n- Objects range from 0 bytes to a **50 TB** maximum (raised from 5 TB in December 2025; older material says 5 TB). Total storage is unlimited.\n- S3 Standard keeps data across at least three AZs. **Intelligent-Tiering** moves objects between access tiers based on monitored access, with no retrieval fees and a small monitoring fee (it is not described as machine learning). **Standard-IA** is as fast as Standard but charges a retrieval fee, so frequent reads get expensive. **One Zone-IA** keeps one AZ copy; use it only for data you can re-create.\n- Archive data now lives in the **S3 Glacier storage classes** inside S3; the original vault-based Glacier service is legacy. **S3 on Outposts** has its own class for keeping S3 data on premises.\n- Bucket types: **general purpose** (the normal choice), **directory buckets** (for S3 Express One Zone), plus **table buckets** and **vector buckets** for newer use cases.",
      "**S3 security and protection**",
      "- Objects and buckets are **private by default**, and **Block Public Access** is on for new buckets. You must turn it off on purpose before any policy can make data public.\n- Use **bucket policies** (Effect, Principal, Action such as `s3:GetObject`, Resource as an ARN like `arn:aws:s3:::my-bucket/*`). `s3:GetObject` on the whole bucket is very broad; least privilege scopes it to a prefix or adds conditions. ACLs are legacy: AWS recommends Object Ownership set to *bucket owner enforced*, which disables ACLs.\n- A **presigned URL** shares one private object for a limited time you set.\n- **Encryption at rest is always on** by default with SSE-S3 (S3-managed keys). Alternatives: **SSE-KMS** (keys in AWS KMS; S3 Bucket Keys cut KMS request costs) and **DSSE-KMS** (dual-layer encryption).\n- **Versioning** keeps every version, protecting against accidental overwrites and deletions, or an attacker deleting data. **Object Lock** adds write-once-read-many (WORM) protection for a retention period or indefinitely, and requires versioning.\n- Uploads can include checksums (such as SHA or CRC) to verify integrity.\n- A bucket must be **emptied before it can be deleted**.",
      "**EBS details**: volumes and snapshots live in the EC2 console; **Amazon Data Lifecycle Manager** automates snapshot schedules. Volume types:",
      "- **General Purpose SSD**: gp3 is current and generally preferred over gp2.\n- **Provisioned IOPS SSD** (io1/io2): demanding databases.\n- **Throughput Optimized HDD** (st1) and **Cold HDD** (sc1): can't be boot volumes.",
      "Turn on encryption at launch, or by default for the Region. Encrypting an existing unencrypted volume later means snapshot, encrypted copy, then restore.",
      "**EFS details**: serverless and elastic; you pay for what you store, with no size to provision. Options: **Regional** (multi-AZ) or **One Zone** storage, lifecycle management to move cold files to cheaper Infrequent Access and Archive tiers, and throughput modes (Elastic, Provisioned or Bursting).",
      "EFS creates a **mount target** in each AZ of the VPC, and **access points** give apps their own entry point. Files outlive any instance: a new instance mounting the same file system sees the same data.",
    ),
    analogy:
      "EBS is a hard drive on your desk: fast and yours, but one desk at a time. EFS is a shared network folder the whole office can open. S3 is a giant warehouse of labeled boxes: you hand over a box and get a ticket, and never edit a box in place. Glacier is the archive basement: cheap shelves, but fetching a box takes a while.",
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
      "EBS volumes are network-attached and replicated within their AZ. They survive an instance stop but not the loss of the AZ; snapshots protect against that. EFS replicates across multiple AZs and grows and shrinks automatically. S3 replicates objects across multiple AZs (except One Zone classes) and offers versioning, cross-Region replication, encryption and access controls.",
      "S3 access is controlled by IAM policies, bucket policies and Block Public Access settings. Presigned URLs grant temporary access to objects.",
    ),
    diagram: `  EC2 instance
    |-- Instance store (local, ephemeral)
    |-- EBS volume (one AZ)  --snapshots--> S3-backed storage
    '-- EFS mount (shared, multi-AZ)

  Application / users --HTTP API--> S3 bucket (objects)
        lifecycle: Standard -> IA -> Glacier -> Deep Archive -> expire`,
    whyItExists: md(
      "Data differs in access pattern, performance needs and value. One storage type for everything would be too slow, too costly or too fragile. Specialised types match cost to need.",
    ),
    whenToUse: md(
      "- EBS: databases and boot volumes.\n- EFS: shared Linux file systems.\n- S3: static content, backups, logs and analytics data.\n- Lifecycle rules: cut cost as data ages.\n- Intelligent-Tiering: unpredictable access.",
    ),
    whenNotToUse: md(
      "Don't keep irreplaceable data on instance store. Don't use S3 as a low-latency block device for a database. Don't put hot data in deep archive classes: retrieval is slow and fees apply.",
    ),
    commonMistakes: [
      "Treating durability and availability as the same thing.",
      "Leaving buckets public.",
      "Forgetting EBS volumes and snapshots keep costing after instances are deleted.",
      "Moving small objects to cold classes where minimum size or duration charges outweigh savings.",
      "Using One Zone classes for data you cannot recreate.",
      "Using Storage Gateway when a one-time bulk move is needed - that is DataSync or Snow Family territory.",
      "Choosing Standard-IA for data read many times a month; retrieval fees make it cost more than Standard.",
      "Trying to delete a bucket that still has objects (or old versions) in it.",
      "Making a whole bucket public to share one file instead of using a presigned URL.",
      "Expecting to use an HDD (st1/sc1) EBS volume as a boot volume.",
      "Launching unencrypted EBS volumes and having to snapshot-copy-restore later to encrypt them.",
      "Assuming S3 bucket names only need to be unique in your account; they are globally unique.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Classify each as block, file, or object: EBS, EFS, S3, instance store." },
      { difficulty: "Medium", prompt: "Write lifecycle rules for application logs kept 7 years with the cheapest cost and rare retrieval." },
      { difficulty: "Medium", prompt: "Use the unit converter to estimate the monthly size of 1 TB written daily and what that means for storage class choice." },
      { difficulty: "Hard", prompt: "Explain how you would restore a database volume after an AZ failure using snapshots, and what data could be lost." },
      { difficulty: "Easy", prompt: "Pick block, file or object storage for: a shared folder for ten Linux web servers, a database disk, user-uploaded profile photos." },
      { difficulty: "Medium", prompt: "Write a bucket policy that lets anyone read only the objects under the `public/` prefix of one bucket, and list what else must be changed before it works." },
      { difficulty: "Medium", prompt: "Design protection for regulated records that must not be deleted for seven years, even by administrators. Which S3 features do you combine?" },
    ],
    interviewQuestions: [
      { question: "Durability vs availability for S3?", answer: "Durability is the likelihood data is not lost (eleven nines); availability is the likelihood you can access it at a moment, which differs between classes." },
      { question: "EBS vs EFS?", answer: "EBS is block storage usually attached to a single instance in one AZ; EFS is a shared network file system accessible from many instances across AZs." },
      { question: "What happens to instance store data when the instance stops?", answer: "It is lost." },
      { question: "Exam-style: Which S3 class is cheapest for long-term archives retrieved rarely?", answer: "S3 Glacier Deep Archive." },
      { question: "Exam-style: Which feature automatically moves objects between storage classes over time?", answer: "S3 Lifecycle rules (or S3 Intelligent-Tiering for unpredictable access)." },
      { question: "Exam-style: Which service gives on-premises applications access to cloud storage with local caching?", answer: "AWS Storage Gateway." },
      { question: "Which service centralises backup policies across many AWS services?", answer: "AWS Backup." },
      { question: "Which service provides managed SFTP into Amazon S3?", answer: "AWS Transfer Family." },
      { question: "Exam-style: How can you share a private S3 object with a customer for a limited time without making it public?", answer: "Generate a presigned URL with an expiry." },
      { question: "Exam-style: Which S3 feature provides write-once-read-many (WORM) protection?", answer: "S3 Object Lock (requires versioning)." },
      { question: "Exam-style: Which feature protects S3 data from accidental overwrites and deletions by keeping old copies?", answer: "S3 Versioning." },
      { question: "Exam-style: Which storage service gives many Windows servers a shared SMB file system?", answer: "Amazon FSx for Windows File Server." },
      { question: "Exam-style: Which service is a high-performance file system for HPC and machine learning workloads?", answer: "Amazon FSx for Lustre." },
      { question: "What are the three Storage Gateway types?", answer: "File Gateway (files stored as S3 objects), Volume Gateway (block volumes backed up to AWS) and Tape Gateway (virtual tapes for existing backup software)." },
      { question: "What is the maximum size of a single S3 object?", answer: "50 TB (it was 5 TB until December 2025)." },
      { question: "Is S3 data encrypted by default?", answer: "Yes. All new objects are encrypted at rest with SSE-S3 unless you choose SSE-KMS or DSSE-KMS." },
    ],
    prerequisites: ["ec2-basics", "iam-basics"],
    relatedTopics: ["aws-databases", "dns-and-cdn", "security-services", "pricing-and-billing", "migration-and-innovation"],
    keywords: ["s3", "ebs", "efs", "instance store", "glacier", "storage class", "lifecycle", "snapshot", "durability", "object storage", "express one zone", "fsx", "storage gateway", "aws backup", "elastic disaster recovery", "transfer family", "sftp", "presigned url", "bucket policy", "block public access", "versioning", "object lock", "worm", "sse-s3", "sse-kms", "gp3", "io2", "mount target", "data lifecycle manager", "directory bucket", "intelligent-tiering", "file gateway", "tape gateway", "volume gateway"],
  },

  {
    id: "aws-databases",
    title: "AWS Database Services",
    level: "intermediate",
    description: "RDS, Aurora, DynamoDB, Redshift and the specialised and migration database services.",
    explanation: md(
      "AWS offers purpose-built databases, not one-size-fits-all.",
      "- **Amazon RDS**: managed relational databases (MySQL, PostgreSQL, MariaDB, Oracle, SQL Server, Db2). AWS handles backups, patching and failover (Multi-AZ); you manage schema and queries.\n- **Amazon Aurora**: AWS's cloud-built relational engine, compatible with MySQL and PostgreSQL, with storage replicated across AZs and fast failover.\n- **Amazon DynamoDB**: serverless key-value and document NoSQL database with single-digit-millisecond performance at nearly any scale.\n- **Amazon Redshift**: data warehouse for analytic SQL over large datasets.\n- **Amazon ElastiCache**: managed in-memory cache (Valkey, Redis OSS and Memcached engines) that caches hot data to cut latency and database load. **DAX** is an in-memory cache just for DynamoDB.\n- **Amazon MemoryDB**: a durable, Redis-compatible in-memory database that can be the primary store.\n- **Amazon DocumentDB**: MongoDB-compatible document database.\n- **Amazon Neptune**: graph database for highly connected data such as fraud rings, social networks and recommendations (queried with Gremlin, openCypher or SPARQL).\n- **Amazon Keyspaces**: managed Cassandra-compatible database.\n- **Amazon Timestream**: time-series data that changes over time, such as IoT sensor readings.",
      "Migration helpers: **AWS Database Migration Service (DMS)** moves data between databases, often with little downtime. **AWS Schema Conversion Tool (SCT)** / **DMS Schema Conversion** converts schema and code when engines differ (for example Oracle to Aurora PostgreSQL).",
      "Note: Amazon QLDB (a ledger database with an immutable, cryptographically verifiable journal) reached end of support in July 2025; AWS suggests Aurora PostgreSQL for ledger-style needs. Treat it as retired in older material. Service lineups change, so check current docs.",
      "**EC2-hosted vs managed databases**: you can install a database on an EC2 instance, but then you handle patching, backups, high availability, replication and scaling yourself. RDS, Aurora or DynamoDB automate those tasks. Self-host only for unsupported engines, full OS access or special licensing.",
      "**Database vocabulary the exam assumes**",
      "- **Relational (OLTP)**: tables, rows and columns, stored row by row and queried with SQL. What people usually mean by 'a database' (PostgreSQL, MySQL). Good for many small, real-time transactions.\n- **Data warehouse (OLAP)**: also relational, but stored column by column so it aggregates huge datasets (totals, averages) fast. Data is loaded from other systems via ETL/ELT, and it serves reports and analysis, not live transactions. On AWS: **Redshift**.\n- **Key-value (NoSQL)**: a key and a value. Very fast and scales well, but no joins. Schemaless, so items can have different attributes.\n- **Document (NoSQL)**: a key-value store holding JSON-like documents. Tables become *collections*, rows *documents*, columns *fields*; joins are replaced by embedding or linking.\n- **Wide-column** (Keyspaces, Cassandra-compatible), **graph** (Neptune) and **time-series** (Timestream) cover other shapes.",
      "**DynamoDB details**: every table needs a **partition key** and optionally a **sort key**. Capacity is **on-demand** (pay per request, the most serverless option) or **provisioned** (set read and write capacity, optionally with auto scaling).",
      "It encrypts at rest by default and supports secondary indexes, time-to-live (TTL) expiry, deletion protection and **PartiQL**, a SQL-compatible query language. You manage no shards or servers, which is why it is AWS's go-to answer for 'massively scalable' NoSQL.",
      "**RDS and Aurora details**:",
      "- Oracle and SQL Server on RDS need a licence (license-included or bring your own).\n- **Aurora** is MySQL- and PostgreSQL-compatible, faster than the standard engines, and built for high availability and durability, at a higher price than basic RDS.\n- **Aurora Serverless v2** scales capacity up and down in place almost instantly, suiting variable or infrequent workloads (the cold-start behaviour some material mentions applied to v1, now end of life).\n- **RDS Proxy** pools and shares connections, protecting a database from being flooded by many Lambda functions.\n- Store credentials in **AWS Secrets Manager**, keep the database private in the VPC, and connect from an app server (PostgreSQL listens on port 5432 by default).",
      "**Redshift details**: petabyte-scale and fast for complex analytical queries, but it can be expensive, so delete trial clusters (or use **Redshift Serverless**). Data usually loads from S3 with the `COPY` command, and **Query Editor v2** runs SQL and charts results in the browser.",
    ),
    analogy:
      "Choosing a database is like choosing storage furniture. A relational database is a filing cabinet with labeled, linked folders and strict forms. DynamoDB is a wall of numbered lockers: very fast to open by number, but not for complicated questions. Redshift is a reading room where analysts compare thousands of books at once. A cache is the sticky note on your monitor.",
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
      "RDS runs a database engine on managed instances. Multi-AZ keeps a standby in another AZ and fails over automatically; read replicas scale reads. Aurora separates compute from a shared, replicated storage layer that grows automatically. DynamoDB partitions data by key across many servers and replicates it across AZs; you pay per request or provision capacity.",
      "Redshift stores data in columns and spreads queries across nodes, so aggregates are fast. Caches sit in front of a database and answer repeat reads from memory.",
    ),
    diagram: `  App --> ElastiCache / DAX (hot reads)
     |
     +--> RDS / Aurora   (relational, SQL, transactions)
     +--> DynamoDB       (key-value, scale-out)
     '--> Redshift       (analytics, columns)

  On-prem DB --[SCT convert schema]--> [DMS replicate] --> target DB`,
    whyItExists: md(
      "Running databases yourself means patching, backups, failover and capacity planning. Managed databases remove that, and specialised engines fit each data shape far better than one model for everything.",
    ),
    whenToUse: md(
      "Pick by data shape and access pattern: relational for joins and transactions, DynamoDB for predictable key-based access at scale, Redshift for analytics, caches to speed up reads.",
    ),
    whenNotToUse: md(
      "Don't use DynamoDB for ad-hoc relational queries over many fields. Don't use RDS for petabyte-scale analytics. Don't run your own database on EC2 unless you need control a managed service can't give.",
    ),
    commonMistakes: [
      "Using a relational database for everything out of habit, or NoSQL without defining access patterns first.",
      "Believing Multi-AZ improves read throughput (read replicas do; Multi-AZ is for availability).",
      "Skipping backup and retention settings review.",
      "Leaving a database publicly accessible.",
      "Treating DMS as a schema converter (that is SCT's job).",
      "Choosing Redshift for an app's live transactions; it is built for analytics (OLAP), not OLTP.",
      "Expecting joins in DynamoDB; model your data around access patterns instead.",
      "Opening a database to the internet so a laptop can connect, instead of connecting through an app server or bastion in the VPC.",
      "Letting thousands of Lambda invocations open their own database connections; use RDS Proxy.",
      "Installing a database on EC2 'to save money' and forgetting the staff time for backups, patching and failover.",
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
      { question: "What does ElastiCache provide?", answer: "A managed in-memory cache (Valkey, Redis OSS or Memcached) to cut read latency and database load." },
      { question: "Exam-style: Which service is a petabyte-scale data warehouse?", answer: "Amazon Redshift." },
      { question: "Exam-style: Which service converts a database schema when migrating between engines?", answer: "AWS Schema Conversion Tool (SCT)." },
      { question: "Exam-style: Which service reduces read latency with an in-memory cache in front of a database?", answer: "Amazon ElastiCache." },
      { question: "Exam-style: What is the main advantage of RDS over a database on EC2?", answer: "AWS automates patching, backups, replication and failover, reducing operational overhead." },
      { question: "Exam-style: Which database is MongoDB-compatible?", answer: "Amazon DocumentDB." },
      { question: "Exam-style: Which database is Apache Cassandra-compatible?", answer: "Amazon Keyspaces." },
      { question: "Exam-style: Which database stores IoT sensor readings that change over time?", answer: "Amazon Timestream." },
      { question: "Exam-style: A company needs a serverless NoSQL database with single-digit-millisecond latency at any scale. Which service?", answer: "Amazon DynamoDB." },
      { question: "Exam-style: Which database best detects fraud rings by analysing relationships between accounts?", answer: "Amazon Neptune (graph database)." },
      { question: "OLTP vs OLAP?", answer: "OLTP handles many small real-time transactions in a row-oriented relational database (RDS, Aurora). OLAP runs large analytical aggregations over column-oriented data (Redshift)." },
      { question: "What are DynamoDB's two capacity modes?", answer: "On-demand (pay per request) and provisioned (set read/write capacity, optionally with auto scaling)." },
    ],
    prerequisites: ["vpc-networking", "block-file-object-storage"],
    relatedTopics: ["migration-and-innovation", "security-services", "serverless-and-containers", "caching", "databases"],
    keywords: ["rds", "aurora", "dynamodb", "redshift", "elasticache", "dax", "memorydb", "documentdb", "neptune", "dms", "sct", "nosql", "elasticache", "memorydb", "self-managed database", "keyspaces", "timestream", "oltp", "olap", "data warehouse", "key-value", "document database", "partition key", "sort key", "partiql", "aurora serverless", "rds proxy", "valkey", "qldb", "graph database"],
  },

  {
    id: "disaster-recovery",
    title: "Disaster Recovery and Business Continuity",
    level: "intermediate",
    description: "Plan for outages with RPO and RTO, pick a DR strategy from backup and restore to multi-site active/active, and know AWS Backup and Elastic Disaster Recovery.",
    explanation: md(
      "A **disaster** takes a workload down for longer than a normal failure: a Region-wide outage, a flooded data center, ransomware, or a deleted production database. **Disaster recovery (DR)** is how you get the workload back. **Business continuity** is the wider goal: keep the business running during and after the disruption.",
      "A **Business Continuity Plan (BCP)** documents how the business keeps operating during an unplanned disruption. For each workload it sets two numbers:",
      "- **Recovery Point Objective (RPO)**: the maximum acceptable **data loss**, measured as time since the last good recovery point. 'How much data can we afford to lose?' An RPO of one hour means backups or replication are at most one hour behind.\n- **Recovery Time Objective (RTO)**: the maximum acceptable **downtime**, from the interruption until service is restored. 'How long can we be down?'",
      "The business, not IT alone, sets these targets by weighing the cost of downtime and lost data against the cost and complexity of recovery. Smaller RPO and RTO always cost more.",
      "**The four AWS DR strategies**, from cheapest and slowest (cold) to most expensive and fastest (hot):",
      "- **Backup and restore**: back up data (and keep infrastructure as code), then rebuild everything after the event. RPO and RTO in **hours**. Lowest cost; fine for lower-priority workloads.\n- **Pilot light**: data is continuously replicated to another Region, and only core pieces (such as the database) run. Servers are switched on and scaled up after the event. RPO and RTO in **tens of minutes**.\n- **Warm standby**: a scaled-down but fully working copy of production always runs in the recovery Region. On failover you scale it up. RPO and RTO in **minutes**. Suits business-critical workloads.\n- **Multi-site active/active**: a full-scale copy in another Region serves real traffic all the time. Near-zero downtime and data loss for mission-critical workloads, at roughly double the infrastructure cost.",
      "**AWS services that help**",
      "- **AWS Backup**: one place to define backup plans (schedules, retention, cross-Region and cross-account copies) for EC2, EBS, RDS, Aurora, DynamoDB, EFS, FSx, Storage Gateway and more.\n- **AWS Elastic Disaster Recovery (AWS DRS)**, formerly CloudEndure Disaster Recovery: continuously replicates on-premises or cloud servers into a low-cost staging area in a target AWS account and Region, and launches full recovery instances within minutes.\n- **Replication features**: EBS snapshot copies, S3 Cross-Region Replication, RDS cross-Region read replicas, Aurora Global Database and DynamoDB global tables.\n- **Route 53 failover routing** and health checks move users to the recovery site; **CloudFormation** rebuilds infrastructure quickly and identically.",
      "**Multi-AZ vs multi-Region**: spreading across Availability Zones (Multi-AZ RDS, Auto Scaling across AZs) protects against a data center or AZ failure. It is the normal baseline for **high availability**. A copy in a second **Region** protects against a Region-wide problem, and is what the four DR strategies usually mean. High availability keeps you running through small failures; DR gets you back after big ones.",
      "Exam tip: match the words in the question.",
      "- 'Lowest cost, hours acceptable' = backup and restore.\n- 'Core database always replicated, start servers when needed' = pilot light.\n- 'Scaled-down full copy always running' = warm standby.\n- 'Zero downtime, full copy serving traffic' = multi-site active/active.",
    ),
    analogy:
      "Picture a bakery preparing for a fire. Backup and restore is keeping the recipes in a safe at home: you can rebuild, but it takes days. Pilot light is a second kitchen with the pilot flame lit and flour in stock: you still have to turn things on and hire staff. Warm standby is a small second shop already baking a few loaves, ready to ramp up. Active/active is two full bakeries serving customers daily: if one burns, the other carries on.",
    examples: [
      {
        title: "Choosing a DR strategy",
        language: "text",
        code: `Workload                     RPO / RTO target     Strategy
---------------------------  -------------------  -----------------
Internal wiki                24 h / 24 h          Backup and restore
Order history reports        1 h / 1 h            Pilot light
Customer web shop            minutes / minutes    Warm standby
Payment processing           ~0 / ~0              Multi-site active/active`,
        explanation: "Each step down the table costs more because more infrastructure runs all the time in the recovery Region.",
      },
      {
        title: "A daily backup plan with a cross-Region copy (AWS Backup)",
        language: "bash",
        code: `aws backup create-backup-plan --backup-plan '{
  "BackupPlanName": "daily-35d",
  "Rules": [{
    "RuleName": "daily",
    "TargetBackupVaultName": "Default",
    "ScheduleExpression": "cron(0 3 * * ? *)",
    "Lifecycle": { "DeleteAfterDays": 35 },
    "CopyActions": [{
      "DestinationBackupVaultArn": "arn:aws:backup:eu-central-1:111122223333:backup-vault:dr-vault"
    }]
  }]
}'`,
        explanation: "Assign resources to the plan (for example by tag) with create-backup-selection. The cross-Region copy protects against a regional disaster; the daily schedule gives an RPO of about one day.",
      },
    ],
    howItWorks: md(
      "Every DR strategy has two halves. Getting **data** to the recovery site (backups or continuous replication) sets your RPO. Getting **compute** running there (rebuild, start, scale, or already live) sets your RTO.",
      "With backup and restore, backups are copied to another Region and infrastructure is rebuilt from templates. Pilot light and warm standby replicate data continuously (for example a cross-Region database replica) while running little or some compute. In active/active, both Regions take traffic and data replicates both ways.",
      "Failover is usually triggered by health checks: Route 53 sees the primary is unhealthy and answers with the recovery site's address. **Test the plan regularly**; an unrehearsed DR plan rarely meets its RTO.",
    ),
    diagram: `  cost / speed  low ------------------------------> high
  Backup &        Pilot          Warm           Active/
  restore         light          standby        active
  [data only]     [DB running]   [small copy]   [full copy]
  RPO/RTO hours   10s of min     minutes        near zero
        Primary Region ==replicate==> Recovery Region
                 Route 53 failover sends users across`,
    whyItExists: md(
      "Hardware fails, people make mistakes, and disasters hit whole areas. Without a plan, recovery is improvised, slow and often incomplete. Setting RPO and RTO up front lets a business pay for exactly the protection each workload needs.",
    ),
    whenToUse: md(
      "Every production workload needs at least backups and a tested restore. Move up to pilot light, warm standby or active/active as the cost of downtime and data loss grows. Use AWS Backup to centralise backups, and Elastic Disaster Recovery to protect servers (including on-premises ones) with low RPO and RTO.",
    ),
    whenNotToUse: md(
      "Don't pay for multi-site active/active when a workload can tolerate a few hours of downtime. Don't rely on Multi-AZ alone to survive a Region-wide event. Don't treat replication as a backup: deletions and corruption replicate too, so keep point-in-time backups as well.",
    ),
    commonMistakes: [
      "Mixing up RPO (data loss) and RTO (downtime).",
      "Assuming Multi-AZ is a disaster recovery plan for a Region-wide outage.",
      "Never testing restores, then discovering backups are incomplete or too slow to restore.",
      "Keeping backups only in the same Region and account as production.",
      "Treating replication as a backup, so an accidental delete is copied to the DR site instantly.",
      "Calling the service CloudEndure Disaster Recovery; it is now AWS Elastic Disaster Recovery.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Define RPO and RTO in one sentence each and give a business example of a 4-hour RPO." },
      { difficulty: "Medium", prompt: "Order the four DR strategies by cost and recovery time, and give one workload that suits each." },
      { difficulty: "Medium", prompt: "Design an AWS Backup plan for EC2, RDS and EFS with daily backups, 35-day retention and a copy in a second Region." },
      { difficulty: "Hard", prompt: "A shop needs an RTO of 15 minutes and RPO of 1 minute at the lowest reasonable cost. Pick a strategy, name the AWS services for data replication and failover, and describe a failover test." },
    ],
    interviewQuestions: [
      { question: "What is the difference between RPO and RTO?", answer: "RPO is the maximum acceptable data loss, measured back to the last recovery point. RTO is the maximum acceptable time to restore service after an interruption." },
      { question: "Exam-style: Which DR strategy has the lowest cost and the longest recovery time?", answer: "Backup and restore." },
      { question: "Exam-style: Which DR strategy keeps a scaled-down but fully functional copy of production running at all times?", answer: "Warm standby." },
      { question: "Exam-style: Which DR strategy keeps only core components such as the database running and replicated in another Region?", answer: "Pilot light." },
      { question: "Exam-style: Which DR strategy gives near-zero downtime by running full production in multiple Regions?", answer: "Multi-site active/active." },
      { question: "Exam-style: Which service continuously replicates on-premises servers to AWS for fast recovery?", answer: "AWS Elastic Disaster Recovery (formerly CloudEndure Disaster Recovery)." },
      { question: "Exam-style: Which service centrally manages and automates backups across many AWS services?", answer: "AWS Backup." },
      { question: "Does Multi-AZ protect against a Region-wide outage?", answer: "No. Multi-AZ protects against the loss of a data center or Availability Zone; surviving a Region outage needs a copy in another Region." },
    ],
    prerequisites: ["aws-global-infrastructure", "block-file-object-storage", "aws-databases"],
    relatedTopics: ["well-architected-framework", "dns-and-cdn", "auto-scaling-and-load-balancing", "migration-and-innovation", "developer-and-end-user-tools"],
    keywords: ["disaster recovery", "dr", "business continuity", "bcp", "rpo", "rto", "backup and restore", "pilot light", "warm standby", "active active", "multi-site", "aws backup", "elastic disaster recovery", "drs", "cloudendure", "cross-region replication", "failover", "multi-az", "multi-region"],
  },
  {
    id: "monitoring-and-auditing",
    title: "Monitoring and Auditing",
    level: "intermediate",
    description: "CloudWatch for performance, CloudTrail for who-did-what, Config for resource state, and Trusted Advisor for advice.",
    explanation: md(
      "Four services answer four different questions:",
      "- **Amazon CloudWatch**: *How is it performing?* Collects **metrics** (CPU, request counts), **logs** and events. Build **dashboards** and **alarms** that notify or trigger actions such as Auto Scaling.\n- **AWS CloudTrail**: *Who did what, when?* Records API calls and console actions (management events, optionally data events) for auditing and investigation. **CloudTrail Insights** flags unusual activity.\n- **AWS Config**: *What is my configuration, and did it change?* Records resource configurations over time and checks them against rules (for example 'all volumes must be encrypted').\n- **AWS Trusted Advisor**: *What could I improve?* Checks your account against best practices in six categories: cost optimization, performance, security, fault tolerance, service limits and operational excellence. How many checks you get depends on your support plan.",
      "Related services: **AWS Health** (notices about AWS events that affect you), **X-Ray** (tracing requests across services) and **Systems Manager** (operational management of fleets).",
      "Exam trio to never mix up: **CloudTrail** = who did what (API calls). **CloudWatch** = how it is running (metrics, logs, alarms). **X-Ray** = where a request slowed down or failed across distributed services.",
      "**CloudTrail in more depth**",
      "- Records API activity from the console, CLI and SDKs. Each event shows *who* (identity and user agent), *when* (event time), *where* (source IP) and *what* (Region, resource, action).\n- On by default: **Event history** shows the last 90 days of management events at no charge. For longer retention, create a **trail** that delivers logs to an S3 bucket, then query them with **Amazon Athena** (or use **CloudTrail Lake**).\n- **Management events** are logged by default. **Data events** (such as S3 object-level reads and writes, or Lambda invocations) and **CloudTrail Insights** (unusual API activity) are optional and cost extra.\n- Best practice: turn on log file integrity validation and encryption, send logs to a separate locked-down logging account, and use an **organization trail** covering all accounts and Regions.",
      "**CloudWatch is an umbrella** of features:",
      "- **Metrics**: time-ordered data points in per-service namespaces (for EC2: CPUUtilization, DiskReadOps, NetworkIn/Out). Memory and disk-space usage inside an instance need the **CloudWatch agent**.\n- **Logs**: *log events* belong to a *log stream* (one source, such as one instance or one Lambda execution environment); streams belong to a *log group*. Lambda, RDS and Glue send logs automatically; EC2 needs the agent. **Logs Insights** runs interactive queries across log groups in its own query language, with sample and saved queries.\n- **Alarms**: watch a metric against a threshold over several evaluation periods. States: **OK**, **ALARM** and **INSUFFICIENT_DATA**. Actions can notify via SNS, trigger Auto Scaling, or stop/reboot/recover an EC2 instance. A **billing alarm** is a classic first alarm.\n- **Dashboards**: shared visual views of metrics.\n- **Events** became **Amazon EventBridge** (formerly CloudWatch Events): rules fire targets on event patterns or a schedule, for example 'snapshot this server every hour'.",
      "**SLAs, SLIs and SLOs**",
      "- **SLI** (indicator): what you measure, such as availability, latency, throughput, error rate or durability.\n- **SLO** (objective): the target for an SLI over a period, for example 99.99% ('four nines') monthly availability.\n- **SLA** (agreement): a formal promise from provider to customer. If AWS misses it (and you met your side), you get **service credits**, which grow as monthly uptime drops.\n- AWS SLAs are **per service** and differ. For example, DynamoDB promises more for global tables than single-Region tables, the Compute SLA covers EC2, EBS, ECS, EKS and others, and the RDS SLA applies to Multi-AZ deployments. There is no single SLA page; look up '<service> SLA'.",
      "**AWS Health Dashboard** has two views:",
      "- **Service health** (public): status of every AWS service by Region.\n- **Account health** (formerly the Personal Health Dashboard): events, scheduled maintenance and guidance for *your* resources.",
      "It is free for all customers, and its events can drive alerts through EventBridge.",
    ),
    analogy:
      "CloudWatch is a car's dashboard: speed, fuel, warning lights. CloudTrail is its black-box recorder: every door opened and button pressed, with the driver's identity. Config is the maintenance log of how the car changed over time. Trusted Advisor is the mechanic who looks it over and says 'your tires are worn'.",
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
      "Services publish metrics to CloudWatch automatically (basic metrics at regular intervals; detailed monitoring is more frequent). Agents add memory, disk and application logs. Alarms compare metrics with thresholds and fire actions.",
      "CloudTrail delivers event logs to S3 and optionally CloudWatch Logs, recording identity, source IP, time and request parameters. Config snapshots resource state and flags noncompliance.",
    ),
    diagram: `  Resources --metrics/logs--> CloudWatch --alarm--> SNS / Auto Scaling
  Every API call ----------> CloudTrail --> S3 / audit
  Resource config changes -> Config --rules--> compliant / non-compliant
  Account best practices -> Trusted Advisor --> recommendations`,
    whyItExists: md(
      "You can't fix, secure or optimise what you can't see. Monitoring catches problems early, auditing answers 'who did that', and configuration tracking supports compliance and incident response.",
    ),
    whenToUse: md(
      "Turn on CloudTrail in every account, alarm on key health metrics, use Config for compliance rules, and review Trusted Advisor regularly for cost and security wins.",
    ),
    whenNotToUse: md(
      "CloudWatch is not an audit log of user actions (use CloudTrail). CloudTrail is not a performance monitor (use CloudWatch). Trusted Advisor is not a complete security audit.",
    ),
    commonMistakes: [
      "Mixing up CloudWatch and CloudTrail.",
      "Creating alarms nobody receives or acts on.",
      "Not retaining CloudTrail logs long enough for investigations.",
      "Alerting on too many noisy metrics until the team ignores them.",
      "Assuming all Trusted Advisor checks are available on every support plan.",
      "Expecting CloudTrail Event history to keep events forever; create a trail to S3 for long-term retention.",
      "Assuming S3 object reads are in CloudTrail by default; data events must be turned on.",
      "Expecting EC2 memory usage in CloudWatch without installing the CloudWatch agent.",
      "Confusing the SLA (the contract) with the SLO (the target) or the SLI (the measurement).",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Which service answers each: 'Why is the app slow?', 'Who changed the security group?', 'Is every volume encrypted?'" },
      { difficulty: "Medium", prompt: "Create an alarm on a metric and an SNS email subscription. Trigger it and confirm the notification." },
      { difficulty: "Medium", prompt: "Use the cron builder tool to design a schedule for a nightly EventBridge rule that runs a cleanup job." },
      { difficulty: "Hard", prompt: "Outline an incident investigation using CloudWatch, CloudTrail and Config for 'an S3 bucket became public overnight'." },
      { difficulty: "Easy", prompt: "Define SLI, SLO and SLA for a checkout API in one sentence each." },
      { difficulty: "Medium", prompt: "Write a Logs Insights query idea to find the 20 most recent errors in a Lambda function's log group, and say which log group and stream you would expect." },
    ],
    interviewQuestions: [
      { question: "CloudWatch vs CloudTrail?", answer: "CloudWatch monitors performance and operational data (metrics, logs, alarms); CloudTrail records API activity for governance and audit." },
      { question: "What is AWS Config used for?", answer: "Recording resource configuration history and evaluating it against compliance rules." },
      { question: "What are Trusted Advisor categories?", answer: "Cost optimization, performance, security, fault tolerance, service limits, and operational excellence." },
      { question: "Exam-style: Which service logs API calls made in an AWS account?", answer: "AWS CloudTrail." },
      { question: "Exam-style: Which service can alarm when CPU utilisation exceeds a threshold?", answer: "Amazon CloudWatch." },
      { question: "Exam-style: Which service traces requests through a microservices application to find bottlenecks?", answer: "AWS X-Ray." },
      { question: "Exam-style: How long does CloudTrail Event history keep management events, and how do you keep them longer?", answer: "90 days. Create a trail that delivers logs to an S3 bucket (and analyse them with Athena or CloudTrail Lake)." },
      { question: "Exam-style: Where can you see scheduled AWS maintenance that affects your own EC2 instances?", answer: "The account health view of the AWS Health Dashboard." },
      { question: "Exam-style: What does a customer receive if AWS fails to meet a service's SLA?", answer: "Service credits." },
      { question: "What are the three CloudWatch alarm states?", answer: "OK, ALARM and INSUFFICIENT_DATA." },
      { question: "What was Amazon EventBridge formerly called?", answer: "CloudWatch Events." },
    ],
    prerequisites: ["iam-basics", "ec2-basics"],
    relatedTopics: ["security-services", "pricing-and-billing", "well-architected-framework", "monitoring-and-observability"],
    keywords: ["cloudwatch", "cloudtrail", "config", "trusted advisor", "alarm", "metrics", "logs", "audit", "dashboard", "insights", "x-ray", "event history", "trail", "data events", "logs insights", "log group", "log stream", "cloudwatch agent", "eventbridge", "sla", "sli", "slo", "service credits", "health dashboard"],
  },

  {
    id: "analytics-services",
    title: "AWS Analytics Services",
    level: "intermediate",
    description: "Athena, Kinesis, Glue, Amazon Quick (formerly QuickSight), EMR, OpenSearch Service, MSK, Data Exchange and Redshift - which analytics tool fits which data job.",
    explanation: md(
      "**Analytics** turns raw data into answers. AWS has a managed service for each stage: collecting and streaming data, storing and transforming it, querying it and visualising it. You don't run the servers.",
      "- **Amazon Athena**: run standard SQL directly on files in S3 with no servers; you pay per amount of data scanned.\n- **Amazon Kinesis**: collect and process real-time streaming data. *Data Streams* ingests and stores streams, *Data Firehose* delivers streams to S3, Redshift or OpenSearch, and *Managed Service for Apache Flink* analyses streams with SQL or code.\n- **Amazon MSK** (Managed Streaming for Apache Kafka): a managed Kafka cluster for teams already using Kafka.\n- **AWS Glue**: serverless ETL (extract, transform, load) with a **Data Catalog** that stores table definitions so Athena, Redshift and EMR can find your data.\n- **Amazon EMR**: managed big data clusters running Apache Spark, Hadoop, Hive and Presto for large batch processing.\n- **Amazon Redshift**: a managed data warehouse for fast SQL analytics over large structured data, using columnar storage.\n- **Amazon OpenSearch Service**: search, log analytics and dashboards on top of OpenSearch.\n- **Amazon Quick** (formerly Amazon QuickSight, briefly Quick Suite): business intelligence; build interactive dashboards and charts, with ML insights and natural-language questions about your data.\n- **AWS Data Exchange**: find, subscribe to and use third-party datasets in the cloud.",
      "Name changes to recognise:",
      "- **Amazon Data Firehose** was Kinesis Data Firehose.\n- **Amazon Managed Service for Apache Flink** was Kinesis Data Analytics.\n- **Amazon OpenSearch Service** was Amazon Elasticsearch Service.\n- **Amazon Quick** was QuickSight.",
      "**Kinesis Video Streams** ingests and processes video. Kinesis Data Streams lets several consumers read the same records in real time; Firehose is the simpler, serverless way to just deliver a stream to S3, Redshift or OpenSearch.",
      "**More detail on the key services**",
      "- **Athena** is serverless and interactive: point it at CSV, JSON or Parquet files in S3 and pay per query (by data scanned). Its SQL engine is based on Trino (a Presto fork), and it also runs Apache Spark in notebooks. Use it from the console, JDBC/ODBC drivers, CLI and SDKs. It is the usual way to query CloudTrail, load balancer, CloudFront and VPC Flow Logs stored in S3, using tables from the Glue Data Catalog.\n- **Glue**: *crawlers* discover data and infer schemas, the **Glue Data Catalog** centralises that metadata for Athena, EMR and Redshift Spectrum, and **Glue Studio** builds ETL jobs visually.\n- **AWS Lake Formation** helps you build and secure a **data lake**: a central store that keeps raw data in its native format until needed.\n- **Redshift** is the exam's answer for OLAP and data-warehouse questions (OLTP, meaning transactions, points to RDS or Aurora). It feeds BI tools such as Amazon Quick.\n- **Amazon Quick** is comparable to Tableau or Power BI. Its **SPICE** in-memory engine speeds up dashboards, and it offers ML insights such as anomaly detection, forecasting and auto-written narratives.\n- **OpenSearch Service** gives powerful search and log analytics. The older **Amazon CloudSearch** (simpler managed search) and **AWS Data Pipeline** are closed to new customers; use OpenSearch, and Glue or Step Functions, instead.",
      "A common pattern is a **data lake**: raw data lands in S3, Glue catalogs and transforms it, Athena or Redshift queries it, and Amazon Quick visualises the results.",
    ),
    analogy:
      "Think of a city water system. Kinesis is the river with a constant flow. S3 is the reservoir. Glue is the treatment plant that labels and cleans the water. Athena is a tap you open for a glass right now. Redshift is a bottled-water warehouse built for big fast orders. Amazon Quick is the control-room dashboard showing levels.",
    examples: [
      {
        title: "Query CSV files in S3 with Athena",
        language: "sql",
        code: `-- Describe the files once (a table over an S3 prefix)
CREATE EXTERNAL TABLE sales (
  order_id string,
  country  string,
  amount   double
)
ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
LOCATION 's3://my-analytics-bucket/sales/';

-- Then ask a question with plain SQL
SELECT country, SUM(amount) AS revenue
FROM sales
GROUP BY country
ORDER BY revenue DESC
LIMIT 5;`,
        explanation: "No cluster to launch: Athena reads files in place and bills for bytes scanned, so compressing or partitioning data lowers the cost.",
      },
      {
        title: "Match the need to the service",
        language: "text",
        code: `Need                                   Service
-------------------------------------  ---------------------
SQL on files in S3, no servers         Athena
Real-time clickstream ingestion        Kinesis Data Streams
Load a stream into S3 automatically    Amazon Data Firehose
Existing Kafka applications            MSK
Serverless ETL + data catalog          Glue
Spark/Hadoop on big datasets           EMR
Data warehouse for BI queries          Redshift
Log search and dashboards              OpenSearch Service
Business dashboards                    Amazon Quick
Buy third-party datasets               Data Exchange`,
      },
    ],
    howItWorks: md(
      "Analytics systems separate **storage** from **compute** where they can. Data sits cheaply in S3; compute services (Athena, EMR, Redshift Spectrum) read it when needed. Streaming services buffer records in shards or partitions, so consumers read them in order at their own pace.",
      "**Glue crawlers** scan data, infer its schema and write table metadata to the Data Catalog. **Redshift** stores data by column across nodes, so aggregating billions of rows is fast. **Amazon Quick** connects to these sources (and SPICE, its in-memory engine) to render dashboards.",
    ),
    diagram: `  sources        ingest            store & prepare      analyse         visualise
 +--------+   +-----------+     +-------------+   +-----------+   +-----------+
 | apps / |-->| Kinesis / |---->| S3 data lake|-->| Athena    |-->|   Quick   |
 | logs / |   | MSK /     |     |  + Glue ETL |   | Redshift  |   +-----------+
 | IoT    |   | Firehose  |     |  + Catalog  |   | EMR       |
 +--------+   +-----------+     +-------------+   | OpenSearch|
                                                  +-----------+`,
    whyItExists: md(
      "**Big data** means data so large or unstructured that traditional databases and tools struggle to move and process it. Companies produce far more than one database can hold or query, and running Hadoop, Kafka and a warehouse by hand needs specialist staff. Managed analytics services let a small team query large data without that burden.",
    ),
    whenToUse: md(
      "- Athena: occasional SQL over S3 data.\n- Redshift: heavy, repeated BI workloads.\n- Kinesis or MSK: real-time ingestion.\n- Glue: ETL and cataloging.\n- EMR: Spark/Hadoop jobs.\n- OpenSearch: search and log exploration.\n- Amazon Quick: dashboards.\n- Data Exchange: external datasets.",
    ),
    whenNotToUse: md(
      "Don't use Athena or Redshift as an app's transactional database (use RDS or DynamoDB). Don't use EMR for tiny jobs Lambda or Glue could do, or stand up Redshift for a one-off query Athena can answer.",
    ),
    commonMistakes: [
      "Using a data warehouse as an application database.",
      "Storing Athena input as large uncompressed CSV, which makes each query scan (and cost) more than needed.",
      "Confusing Kinesis Data Streams (ingest and hold records) with Firehose (deliver them to a destination).",
      "Forgetting Amazon Quick is for visualisation, not for storing or transforming data.",
      "Picking EMR when a serverless option would remove cluster management.",
      "Answering 'RDS' to a data-warehouse or OLAP question; that is Redshift.",
      "Learning old names only: Kinesis Data Firehose, Kinesis Data Analytics, Elasticsearch Service and QuickSight have all been renamed.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a one-line purpose for each of the nine services in this lesson without looking." },
      { difficulty: "Medium", prompt: "Sketch a data pipeline for website clickstream data that ends in a daily dashboard, naming each AWS service in order." },
      { difficulty: "Medium", prompt: "Explain why partitioning or compressing files lowers Athena cost." },
      { difficulty: "Hard", prompt: "A team already runs Kafka producers and consumers on-premises. Compare moving them to MSK versus rewriting for Kinesis." },
    ],
    interviewQuestions: [
      { question: "Exam-style: Which service lets you run SQL queries directly on data in S3 without provisioning servers?", answer: "Amazon Athena." },
      { question: "Exam-style: Which service is used to build business intelligence dashboards?", answer: "Amazon Quick (formerly Amazon QuickSight)." },
      { question: "Exam-style: Which service is a managed data warehouse?", answer: "Amazon Redshift." },
      { question: "Exam-style: Which service performs serverless ETL and maintains a data catalog?", answer: "AWS Glue." },
      { question: "Exam-style: Which service ingests and processes real-time streaming data?", answer: "Amazon Kinesis (Data Streams, Firehose, Managed Service for Apache Flink)." },
      { question: "Exam-style: Which service lets you find and subscribe to third-party datasets?", answer: "AWS Data Exchange." },
      { question: "Exam-style: Which service runs managed Apache Spark and Hadoop clusters?", answer: "Amazon EMR." },
      { question: "Exam-style: A company already uses Apache Kafka and wants a managed service. Which one?", answer: "Amazon MSK." },
      { question: "Exam-style: Which service helps build, secure and manage a data lake?", answer: "AWS Lake Formation." },
      { question: "Exam-style: Which is the simplest serverless way to load streaming data into S3 or Redshift?", answer: "Amazon Data Firehose (formerly Kinesis Data Firehose)." },
      { question: "Exam-style: Which service provides search and log analytics, formerly called Elasticsearch Service?", answer: "Amazon OpenSearch Service." },
      { question: "What does a Glue crawler do?", answer: "It scans data sources, infers their schema and writes table definitions into the Glue Data Catalog so services like Athena can query them." },
      { question: "Exam-style: Which service ingests and processes live video streams?", answer: "Amazon Kinesis Video Streams." },
    ],
    prerequisites: ["block-file-object-storage", "aws-databases"],
    relatedTopics: ["block-file-object-storage", "aws-databases", "messaging-sqs-sns", "application-integration", "cloud-practitioner-exam"],
    keywords: ["athena", "kinesis", "glue", "quicksight", "emr", "opensearch", "msk", "kafka", "data exchange", "redshift", "data lake", "etl", "data warehouse", "analytics", "amazon quick", "data firehose", "managed service for apache flink", "kinesis video streams", "lake formation", "glue data catalog", "crawler", "spice", "trino", "olap", "big data", "cloudsearch", "elasticsearch"],
  },

  {
    id: "ai-ml-services",
    title: "AI and Machine Learning Services",
    level: "intermediate",
    description: "SageMaker AI, Bedrock, Amazon Q and the ready-made AI services (Rekognition, Comprehend, Lex, Polly, Transcribe, Translate, Textract, Kendra, Personalize), plus AWS ML chips.",
    explanation: md(
      "**Artificial intelligence (AI)** is machines doing things that normally need human intelligence. **Machine learning (ML)** is AI that improves at a task by learning from data instead of being explicitly programmed. **Deep learning** is ML using artificial neural networks loosely inspired by the brain. **Generative AI** creates new content (text, images, audio, code), usually with large **foundation models**.",
      "AWS offers three layers, and the exam mostly asks you to pick the right one:",
      "- **Ready-made AI services**: call an API, no ML knowledge needed (Rekognition, Polly, Comprehend and the others below).\n- **Generative AI services**: **Amazon Bedrock** and **Amazon Q**.\n- **ML platform**: **Amazon SageMaker AI** to build, train and deploy your own models, plus AWS chips and machine images to run them.",
      "**Ready-made AI services** (know what each does):",
      "- **Amazon Rekognition**: analyse images and video to detect objects, people, faces, celebrities, unsafe content and text.\n- **Amazon Textract**: pull text, forms and tables out of scanned documents (more than plain OCR: it keeps the structure).\n- **Amazon Comprehend**: natural language processing. Finds sentiment, entities, key phrases and topics in text such as reviews, support tickets, emails and social posts.\n- **Amazon Translate**: neural machine translation between languages.\n- **Amazon Transcribe**: **speech to text** (call recordings into transcripts, subtitles).\n- **Amazon Polly**: **text to speech** (lifelike voices reading text aloud).\n- **Amazon Lex**: build voice and text chatbots; the same conversational technology as Alexa, often used inside Amazon Connect.\n- **Amazon Kendra**: intelligent enterprise search that answers natural-language questions from your documents, not just keyword matches.\n- **Amazon Personalize**: real-time personalised recommendations, based on the technology behind Amazon.com recommendations.",
      "**Generative AI**",
      "- **Amazon Bedrock**: a fully managed API service giving access to many foundation models (text, image and embeddings) from Amazon and third-party providers. Build generative AI apps, chatbots and agents, and customise models with your own data, with no infrastructure to manage. It is a building block for developers, not a chat app.\n- **Amazon Q**: generative AI assistants. **Amazon Q Developer** (formerly Amazon CodeWhisperer) suggests and explains code in your IDE and helps with AWS tasks. **Amazon Q Business** answers questions over company data.",
      "**Building your own models**",
      "- **Amazon SageMaker AI** (formerly just Amazon SageMaker; the 'Amazon SageMaker' name now covers a wider data and AI platform): fully managed service to build, train, tune and deploy ML models at scale, with frameworks such as PyTorch, TensorFlow and Hugging Face models. **SageMaker Ground Truth** labels training data with human labellers. **Amazon Augmented AI (A2I)** sends low-confidence predictions to people for review.\n- **AWS Deep Learning AMIs** and **Deep Learning Containers** come with popular frameworks preinstalled.\n- **AWS chips for ML**: **AWS Trainium** speeds up *training*, **AWS Inferentia** speeds up *inference* (running a trained model), and the **AWS Neuron** SDK runs ML frameworks on both. Inferentia is not a GPU; GPU instances use NVIDIA or AMD chips. Amazon Elastic Inference was discontinued; use Inferentia-based instances or GPUs instead.",
      "**ML inside other services**:",
      "- **Amazon DevOps Guru** spots abnormal application behaviour from operational metrics, logs and events.\n- **Amazon CodeGuru** reviews code and profiles app performance.\n- **Amazon Fraud Detector** finds online fraud such as fake accounts.",
      "Check current availability of CodeGuru and Fraud Detector before choosing them; AWS has been winding down several older ML services. Older study material may also mention DeepLens, DeepComposer, Elastic Inference, Forecast or the Lookout services, which are discontinued or closed to new customers.",
      "Exam tip: the direction words matter. **Polly** turns text into speech; **Transcribe** turns speech into text; **Translate** changes language; **Textract** extracts text from documents; **Comprehend** understands the meaning of text.",
    ),
    analogy:
      "Think of a restaurant. The ready-made AI services are dishes on the menu: order 'translation' and it arrives. Bedrock is a pantry of prepared sauces from many famous chefs that you combine into your own dish. SageMaker AI is a fully equipped kitchen where you invent recipes from scratch. Trainium and Inferentia are specialised ovens: one for developing recipes, one for serving thousands of plates fast.",
    examples: [
      {
        title: "Which AI service?",
        language: "text",
        code: `Need                                         Service
-------------------------------------------  ----------------
Find faces/objects in photos or video        Rekognition
Read forms and tables from scanned PDFs      Textract
Sentiment of customer reviews                Comprehend
Turn call recordings into text               Transcribe
Read articles aloud                          Polly
Translate a website                          Translate
Customer-service chatbot                     Lex
Search company docs with questions           Kendra
"Customers also bought" recommendations      Personalize
Build a gen AI app on foundation models      Bedrock
AI coding assistant in the IDE               Amazon Q Developer
Train and deploy a custom model              SageMaker AI`,
      },
      {
        title: "Calling ready-made AI services from the CLI",
        language: "bash",
        code: `# Sentiment of a sentence
aws comprehend detect-sentiment --language-code en \\
  --text "The delivery was late but support was brilliant."

# Labels in an image stored in S3
aws rekognition detect-labels \\
  --image '{"S3Object":{"Bucket":"my-photos","Name":"street.jpg"}}' \\
  --max-labels 5

# Text to speech
aws polly synthesize-speech --output-format mp3 --voice-id Joanna \\
  --text "Hello from Amazon Polly" hello.mp3`,
        explanation: "No model training is involved: each call sends data to a pre-trained AWS model and returns the result.",
      },
    ],
    howItWorks: md(
      "**Ready-made services** host pre-trained models behind an API. Send an image, text or audio and get structured results back, paying per request or per unit processed.",
      "**Bedrock** hosts foundation models behind one API. Your app sends a prompt and gets generated output. You can ground answers in your own documents (retrieval-augmented generation), add guardrails and build agents, while AWS runs the infrastructure.",
      "**SageMaker AI** covers the full ML lifecycle: prepare and label data, train on managed compute (Trainium or GPU instances), evaluate, then deploy to an endpoint (which can use Inferentia) that apps call for predictions.",
    ),
    diagram: `  More control / effort
       ^
       |  SageMaker AI   build, train, deploy own models
       |                 (Trainium train, Inferentia infer)
       |  Bedrock / Q    generative AI on foundation models
       |  AI services    Rekognition, Comprehend, Polly...
       +------------------------------------------> ease`,
    whyItExists: md(
      "Building ML from scratch needs specialist skills, lots of data and expensive hardware. AWS packages common AI tasks as simple APIs, offers managed access to foundation models, and runs the heavy training and hosting infrastructure, so teams can add AI features without building it all.",
    ),
    whenToUse: md(
      "- A ready-made AI service: when your task matches one (detecting faces, transcribing calls, translating text).\n- Bedrock: generative AI features on existing foundation models.\n- Amazon Q: AI help for developers and employees.\n- SageMaker AI: a custom model trained on your own data.",
    ),
    whenNotToUse: md(
      "Don't train a custom model in SageMaker AI when a ready-made service already does the job. Don't use AI where simple rules or a database query give an exact answer. Don't send sensitive data to any AI service without checking data handling, Region and compliance requirements.",
    ),
    commonMistakes: [
      "Mixing up Polly (text to speech) and Transcribe (speech to text).",
      "Choosing Comprehend to extract text from a scanned form; that is Textract (Comprehend analyses text you already have).",
      "Thinking Bedrock is a chatbot app like a consumer AI chat site; it is an API service for building apps on many foundation models.",
      "Calling Inferentia a GPU or a training chip; it is an inference accelerator, and Trainium is for training.",
      "Using old names on the exam: CodeWhisperer is now Amazon Q Developer, and SageMaker is now SageMaker AI.",
      "Reaching for SageMaker AI to build image recognition from scratch when Rekognition already provides it.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Match each service to its job without notes: Polly, Transcribe, Translate, Textract, Comprehend, Rekognition, Lex, Kendra, Personalize." },
      { difficulty: "Medium", prompt: "Design a call-center analytics flow: recordings become text, the text gets a sentiment score, and negative calls are flagged. Name each AWS service." },
      { difficulty: "Medium", prompt: "Explain when a company should pick Bedrock rather than SageMaker AI, with one example each." },
      { difficulty: "Hard", prompt: "A retailer wants a support chatbot that answers from its own policy documents. Sketch an architecture using Lex or Bedrock plus a search or knowledge source, and list the risks to manage." },
    ],
    interviewQuestions: [
      { question: "Exam-style: Which service converts text into lifelike speech?", answer: "Amazon Polly." },
      { question: "Exam-style: Which service converts speech into text?", answer: "Amazon Transcribe." },
      { question: "Exam-style: Which service detects objects, faces and inappropriate content in images and video?", answer: "Amazon Rekognition." },
      { question: "Exam-style: Which service extracts text, forms and tables from scanned documents?", answer: "Amazon Textract." },
      { question: "Exam-style: Which service determines the sentiment of customer reviews?", answer: "Amazon Comprehend." },
      { question: "Exam-style: Which service builds conversational chatbots with voice and text?", answer: "Amazon Lex." },
      { question: "Exam-style: Which service gives intelligent search over enterprise documents using natural-language questions?", answer: "Amazon Kendra." },
      { question: "Exam-style: Which service provides real-time product recommendations?", answer: "Amazon Personalize." },
      { question: "Exam-style: Which service provides API access to foundation models from Amazon and other providers for generative AI apps?", answer: "Amazon Bedrock." },
      { question: "Exam-style: Which fully managed service lets data scientists build, train and deploy custom ML models?", answer: "Amazon SageMaker AI." },
      { question: "Exam-style: Which AI assistant generates code suggestions in the IDE (formerly CodeWhisperer)?", answer: "Amazon Q Developer." },
      { question: "Trainium vs Inferentia?", answer: "Trainium is AWS's chip for training ML models; Inferentia is its chip for low-cost, high-performance inference. Both use the AWS Neuron SDK." },
      { question: "AI vs ML vs deep learning?", answer: "AI is the broad goal of machines acting intelligently; ML is AI that learns from data; deep learning is ML using multi-layer neural networks." },
    ],
    prerequisites: ["what-is-cloud-computing", "serverless-and-containers"],
    relatedTopics: ["analytics-services", "application-integration", "developer-and-end-user-tools", "specialised-services", "ec2-pricing"],
    keywords: ["ai", "machine learning", "ml", "deep learning", "generative ai", "foundation model", "sagemaker", "sagemaker ai", "ground truth", "augmented ai", "a2i", "bedrock", "amazon q", "q developer", "codewhisperer", "q business", "rekognition", "textract", "comprehend", "translate", "transcribe", "polly", "lex", "kendra", "personalize", "trainium", "inferentia", "neuron", "devops guru", "codeguru", "fraud detector", "deep learning ami"],
  },
  {
    id: "application-integration",
    title: "Application Integration Services",
    level: "intermediate",
    description: "EventBridge, Step Functions, SNS and SQS recap, API Gateway, SES and Amazon Connect - connecting applications and people.",
    explanation: md(
      "Modern apps are made of many small parts. **Application integration** services connect them loosely, so one piece can fail, slow down or change without breaking the others.",
      "- **Amazon EventBridge**: a serverless event bus. Apps, AWS services and SaaS partners publish *events*; *rules* match them and route them to targets such as Lambda or SQS. It also has scheduled (cron-style) rules and a scheduler.\n- **AWS Step Functions**: visual workflows (state machines) that coordinate steps such as Lambda functions, with retries, branching, parallel work and error handling.\n- **Amazon SQS** (recap): a queue that holds messages until a consumer processes them; decouples producers and consumers.\n- **Amazon SNS** (recap): publish/subscribe notifications that fan one message out to many subscribers (email, SMS, SQS, Lambda, HTTP).\n- **Amazon API Gateway**: creates, publishes and secures REST, HTTP and WebSocket APIs in front of Lambda or other backends, with throttling, caching and authorization.\n- **Amazon SES** (Simple Email Service): send bulk and transactional email, such as receipts and newsletters, at low cost.\n- **Amazon Connect**: a cloud contact center. Customers call or chat, and agents answer in a browser, with routing, IVR menus and analytics, paid per use.",
      "Rule of thumb:",
      "- **SQS**: one consumer pulls work at its own pace.\n- **SNS**: many subscribers all need the message.\n- **EventBridge**: route events by content from many sources.\n- **Step Functions**: the order and state of steps matter.",
      "Integration usually goes through an intermediate system, not direct calls. Common patterns: **queuing**, **streaming**, **pub/sub**, **API gateways**, **state machines** and **event buses**.",
      "**EventBridge buses** (EventBridge was formerly CloudWatch Events): every account has a **default event bus** for events from AWS services. You can add **custom event buses** for your own apps (including sharing across accounts) and **partner event buses** for events from third-party SaaS providers.",
      "**More integration services**",
      "- **Amazon MQ**: a managed message broker for **Apache ActiveMQ** and **RabbitMQ**. Choose it when migrating an app that already speaks those standard protocols, instead of rewriting it for SQS/SNS.\n- **Amazon MSK** (Managed Streaming for Apache Kafka): fully managed Kafka for real-time streaming pipelines, similar in purpose to Kinesis.\n- **AWS AppSync**: a fully managed **GraphQL** API service. A *schema* defines the data model, and *resolvers* connect each field to a data source (DynamoDB, Lambda, OpenSearch, HTTP endpoints, RDS/Aurora, EventBridge). It supports real-time updates through GraphQL *subscriptions*, *merged APIs* that combine several teams' APIs behind one endpoint, and authorization with API keys, IAM, Cognito user pools, OpenID Connect or Lambda authorizers.\n- **API Gateway** also transforms requests and responses and can forward to backends such as Lambda, EC2 or Kinesis.",
      "**Which email service?**",
      "- **SNS**: plain system notifications to operators (alarms, alerts).\n- **SES**: application email, both transactional (sign-up, password reset, invoices) and bulk, with HTML templates, custom domains, inbound receiving and reputation monitoring.\n- **Amazon WorkMail**: managed business mailboxes and calendars for staff, like Outlook or Gmail.\n- **Amazon Pinpoint** was the marketing-campaign service (segments, journeys). It is closed to new customers, and its engagement features end in October 2026, moving to **AWS End User Messaging** and **Amazon Connect**. Older exam material may still list it for marketing campaigns.",
    ),
    analogy:
      "Picture a restaurant. Orders wait for the cook on a ticket rail (SQS). A loudspeaker announces 'table 4 is ready' to everyone (SNS). A switchboard sends each kind of message to the right station (EventBridge). The head chef follows the recipe step by step (Step Functions). A host at the door checks reservations (API Gateway). There's also a mailing desk (SES) and a phone line for customers (Connect).",
    examples: [
      {
        title: "An EventBridge rule that matches an event",
        language: "json",
        code: `{
  "source": ["my.orders.app"],
  "detail-type": ["OrderPlaced"],
  "detail": { "amount": [{ "numeric": [">", 100] }] }
}`,
        explanation: "This pattern matches only OrderPlaced events over 100 and can send them to a target, such as a Lambda function for review.",
      },
      {
        title: "A tiny Step Functions workflow",
        language: "json",
        code: `{
  "StartAt": "ChargeCard",
  "States": {
    "ChargeCard": { "Type": "Task", "Resource": "arn:aws:lambda:...:charge", "Next": "SendReceipt",
      "Retry": [{ "ErrorEquals": ["States.ALL"], "MaxAttempts": 2 }] },
    "SendReceipt": { "Type": "Task", "Resource": "arn:aws:lambda:...:receipt", "End": true }
  }
}`,
        explanation: "Each state is a step. Step Functions tracks progress and retries failures, so you don't hand-code that logic.",
      },
    ],
    howItWorks: md(
      "**Event-driven design**: a producer emits an event without knowing who consumes it. EventBridge checks rules against each event and invokes matching targets. **Queues** store messages durably until deleted, buffering spikes. **SNS topics** push to every subscriber at once. **Step Functions** saves each execution's state, so a long workflow survives individual failures.",
      "**API Gateway** receives the HTTP request, authenticates it (IAM, Cognito or a Lambda authorizer), applies throttling and optional caching, and forwards it to the backend.",
    ),
    diagram: `  Producer --event--> EventBridge --rule A--> Lambda
                          |--rule B--> SQS --> worker
  User --> API Gateway --> Lambda --> SNS --> email / SMS / SQS
  Step Functions:  [Validate] -> [Charge] -> [Ship] -> [Notify]`,
    whyItExists: md(
      "Tightly coupled systems fail together and are hard to change. Messaging, events and workflows isolate failures, absorb spikes and let teams change parts independently.",
    ),
    whenToUse: md(
      "Use them to decouple microservices, process orders asynchronously, expose APIs, orchestrate multi-step business processes, send notification emails, or run a support line without hardware.",
    ),
    whenNotToUse: md(
      "Don't add queues and workflows to a simple synchronous app that needs one function call. Don't use SES for personal inboxes (it sends and receives application email), or Step Functions for sub-millisecond logic.",
    ),
    commonMistakes: [
      "Using SNS when you need messages to wait for a slow consumer (that is SQS).",
      "Writing retry and branching logic by hand inside Lambda instead of using Step Functions.",
      "Exposing a Lambda or backend directly to the internet when API Gateway would add auth and throttling.",
      "Thinking Amazon Connect is a telephone hardware product; it is a cloud service.",
      "Rewriting an ActiveMQ or RabbitMQ application for SQS during a lift-and-shift when Amazon MQ would run it unchanged.",
      "Using SNS email for customer-facing messages; use SES.",
      "Confusing AppSync (GraphQL) with API Gateway (REST, HTTP and WebSocket APIs).",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Match each service to its job: EventBridge, Step Functions, API Gateway, SES, Connect." },
      { difficulty: "Medium", prompt: "Design an order flow where one 'order placed' event triggers inventory, billing and email independently." },
      { difficulty: "Medium", prompt: "Explain the difference between SQS and SNS using a real example." },
      { difficulty: "Hard", prompt: "Model a refund approval process with a manual approval and a timeout as a state machine on paper." },
    ],
    interviewQuestions: [
      { question: "Exam-style: Which service coordinates multiple AWS services into a visual serverless workflow?", answer: "AWS Step Functions." },
      { question: "Exam-style: Which service routes events from AWS services and SaaS applications to targets using rules?", answer: "Amazon EventBridge." },
      { question: "Exam-style: Which service creates and secures REST APIs?", answer: "Amazon API Gateway." },
      { question: "Exam-style: Which service sends transactional or marketing email?", answer: "Amazon SES." },
      { question: "Exam-style: Which service provides a cloud-based contact center?", answer: "Amazon Connect." },
      { question: "When do you choose SNS over SQS?", answer: "When one message must reach many subscribers at once; SQS is for a queue consumed by workers." },
      { question: "Exam-style: A company is migrating an application that uses Apache ActiveMQ and wants a managed broker without code changes. Which service?", answer: "Amazon MQ." },
      { question: "Exam-style: Which service provides managed GraphQL APIs with real-time subscriptions?", answer: "AWS AppSync." },
      { question: "Exam-style: Which service gives employees managed business email and calendars?", answer: "Amazon WorkMail." },
      { question: "What kinds of event bus does EventBridge offer?", answer: "The default bus (AWS service events), custom buses for your own applications, and partner buses for third-party SaaS events." },
    ],
    prerequisites: ["messaging-sqs-sns", "serverless-and-containers"],
    relatedTopics: ["messaging-sqs-sns", "serverless-and-containers", "analytics-services", "developer-and-end-user-tools"],
    keywords: ["eventbridge", "step functions", "sns", "sqs", "api gateway", "ses", "connect", "event driven", "decoupling", "workflow", "contact center", "amazon mq", "activemq", "rabbitmq", "msk", "appsync", "graphql", "event bus", "partner event bus", "workmail", "pinpoint", "end user messaging"],
  },

  {
    id: "developer-and-end-user-tools",
    title: "Developer and End-User Tools",
    level: "intermediate",
    description: "CloudShell, Cloud9, the Code* CI/CD suite, X-Ray, AppConfig, Amplify, AppSync, Device Farm, WorkSpaces, AppStream 2.0 and IoT.",
    explanation: md(
      "Beyond core infrastructure, AWS offers tools for developers who build and ship software, and services that deliver desktops and apps to end users.",
      "**Availability note:** AWS sometimes stops taking new customers for a service or retires it (for example Cloud9 and parts of the Code* suite are closed to new customers). Always **check current availability** before choosing a service, but know them for the exam.",
      "**Developer tools**",
      "- **AWS CloudShell**: a browser-based shell with the AWS CLI preinstalled, signed in with your console credentials.\n- **AWS Cloud9**: a browser-based IDE for writing and debugging code. Closed to new customers since July 2024; use CloudShell, a local IDE with the AWS Toolkit, or the console's built-in editors instead.\n- **CI/CD suite**: **AWS CodeCommit** (Git repositories, closed to new customers), **CodeBuild** (compile and test), **CodeDeploy** (deploy to EC2, Lambda, on-premises), **CodePipeline** (automate the release stages) and **CodeArtifact** (store packages). **CodeStar** (project templates) was discontinued in July 2024. A typical modern pipeline: a push to GitHub triggers CodePipeline, CodeBuild builds and tests, and CodeDeploy does a **blue/green** deployment, creating a new environment and shifting traffic to it.\n- **AWS X-Ray**: traces requests through a distributed app to find slow or failing components.\n- **AWS AppConfig** (part of Systems Manager): deploy app configuration and feature flags safely, with validation and gradual rollout.\n- **AWS Amplify**: build, host and connect web and mobile front ends to backends such as authentication and storage.\n- **AWS AppSync**: managed GraphQL (and pub/sub) APIs that connect to data sources.\n- **AWS Device Farm**: test web and mobile apps on real phones and browsers.\n- **AWS Toolkit for VS Code** (and other IDEs): an open-source extension to browse resources (AWS Explorer), view CDK stacks, get help writing ECS task definitions, and build, debug and deploy serverless apps with SAM and CloudFormation.\n- **Configuration and secrets**: **Systems Manager Parameter Store** holds app settings and environment variables. **AWS Secrets Manager** holds secrets such as database passwords, with automatic rotation; apps fetch them at runtime.",
      "**Infrastructure as Code (IaC)**",
      "IaC means scripts that create, update and destroy infrastructure automatically. The files double as a shareable, version-controlled blueprint and inventory of your environment.",
      "- **AWS CloudFormation**: *declarative* IaC. You describe the end state in JSON or YAML templates. It is explicit and verbose, which lowers the chance of misconfiguration. A template has `AWSTemplateFormatVersion` (still `2010-09-09`), a `Description` and `Resources` (such as `AWS::S3::Bucket`). Pseudo parameters like `AWS::StackName` and `AWS::AccountId` help build unique names. Upload a template (directly or from S3) or design it visually in **AWS Infrastructure Composer**. CloudFormation creates a **stack**, and the stack's events show why a deployment failed.\n- **AWS CDK** (Cloud Development Kit): *imperative-style* IaC in TypeScript, JavaScript, Python, Java, C#/.NET or Go. Less verbose but more implicit. CDK **synthesizes CloudFormation templates** and deploys them as stacks, so knowing CloudFormation still helps you debug. Extras: reusable construct libraries (Construct Hub), the CDK CLI, CDK Pipelines for CI/CD and an assertions library for unit tests.\n- **AWS SAM** (Serverless Application Model): a CloudFormation extension with shorthand for serverless apps.",
      "Exam trap, **CDK vs SDK**: both use programming languages, but CDK manages *desired state*. Deploying 'one VM' ten times still gives one VM (idempotent). An SDK script just makes API calls, so running a 'create instance' script ten times creates ten instances.",
      "Once a stack manages a resource, change it by updating the template and redeploying. Editing by hand causes **drift**. Deleting a stack deletes its resources (a non-empty S3 bucket must be emptied first).",
      "**Provisioning and platform services** (most use CloudFormation underneath)",
      "- **AWS Elastic Beanstalk**: a PaaS, similar to Heroku. Pick a platform (Docker, Go, .NET, Java, Node.js, PHP, Python, Ruby, Tomcat) and upload code. It provisions EC2, Auto Scaling, load balancing, optionally RDS, CloudWatch monitoring and SNS notifications, and you can still see and change those resources. Two environment tiers: **web server** (HTTP requests) and **worker** (background jobs pulled from an SQS queue), with presets from a cheap single instance to high availability. Deployment policies: all at once, rolling, rolling with additional batch, immutable, traffic splitting and blue/green (by swapping environment URLs). It also gives health monitoring, logs, managed platform updates and application versions you can roll back to.\n- **AWS Amplify**: tools plus fully managed hosting for full-stack web and mobile apps: Amplify Hosting (static and server-rendered sites with CI/CD), client libraries, UI components, and a backend built from Cognito, AppSync or API Gateway, S3, DynamoDB and Lambda. **Amplify Gen 2** (generally available since 2024) is code-first TypeScript.\n- **AWS Quick Starts** (now AWS Partner Solutions): reference deployments as CloudFormation templates. **AWS Marketplace**: a digital catalogue of third-party software you can find, buy and deploy on AWS.",
      "**Media**: **AWS Elemental MediaConvert** is the current file-based video transcoding service (many output formats, overlays, captions). It replaces the legacy **Amazon Elastic Transcoder**. **AWS Elemental MediaConnect** is different: it transports *live* video.",
      "**Business applications** mostly appear as distractors:",
      "- **Amazon Connect**: cloud contact center with phone numbers, inbound and outbound calls, IVR call flows, recording and queues; the same system Amazon's own customer service uses.\n- **Amazon WorkMail**: business email and calendars.\n- **Amazon SES**: application email.\n- **Amazon Quick**: BI dashboards (formerly QuickSight).",
      "Amazon WorkDocs was discontinued in April 2025, and Amazon Chime meetings ended in February 2026.",
      "**End-user computing**",
      "- **Amazon WorkSpaces Family**: managed virtual desktops (Windows or Linux). A desktop-as-a-service (DaaS) that scales to thousands of users anywhere, billed monthly or hourly. **WorkSpaces Secure Browser** (formerly WorkSpaces Web) gives a secure, isolated browser for internal web apps.\n- **Amazon AppStream 2.0**: streams a single desktop *application* to a browser instead of a whole desktop.",
      "**Internet of Things**",
      "- **AWS IoT Core**: connects devices securely and routes their messages. **AWS IoT Greengrass** extends AWS to the device edge so it can run code and make decisions locally, even offline.",
    ),
    analogy:
      "Building software is like running a factory. CloudShell and Cloud9 are the workbench. The Code* services are the assembly line from source to shipping dock. X-Ray is the tracking label showing where a parcel got stuck. AppConfig is the switchboard for turning features on gradually. WorkSpaces and AppStream deliver a ready workstation, or a single tool, to any employee's door.",
    examples: [
      {
        title: "A buildspec for CodeBuild",
        language: "yaml",
        code: `version: 0.2
phases:
  install:
    commands:
      - npm ci
  build:
    commands:
      - npm test
      - npm run build
artifacts:
  files:
    - "dist/**/*"`,
        explanation: "CodeBuild reads this file, runs each phase in a fresh container, and saves the dist files as build output for CodePipeline to deploy.",
      },
      {
        title: "CloudShell: no setup required",
        language: "bash",
        code: `# Open CloudShell from the console toolbar, then:
aws sts get-caller-identity
aws s3 ls
# Your home folder (1 GB) persists between sessions in that Region`,
        explanation: "CloudShell removes the need to install and configure the CLI locally for quick tasks.",
      },
    ],
    howItWorks: md(
      "**CI/CD**: a commit triggers **CodePipeline**, which pulls source, calls **CodeBuild** to build and test, then **CodeDeploy** to roll out the new version (in place, rolling or blue/green). **X-Ray** tags a request with a trace ID and collects segments from every service it touches, producing a service map.",
      "**WorkSpaces** runs a desktop in AWS and streams pixels to a client, so data stays in the cloud, not on a laptop. **IoT Core** uses MQTT messages and a rules engine to route device data to other AWS services.",
    ),
    diagram: `  Source -> Build -> Test -> Deploy        (CodePipeline orchestrates)
  [Git]    [CodeBuild]      [CodeDeploy] -> EC2 / Lambda / on-prem
  Running app --> X-Ray traces --> service map of slow calls
  Staff laptop <== pixels == WorkSpaces desktop in AWS`,
    whyItExists: md(
      "Teams want to ship fast and safely without running build servers. Organisations want to give staff secure desktops without managing physical PCs. Managed tools remove that undifferentiated work.",
    ),
    whenToUse: md(
      "- CI/CD tools: automate releases.\n- X-Ray: debug microservices.\n- AppConfig: gradual feature rollouts.\n- Amplify: quick front-end hosting.\n- Device Farm: device testing.\n- WorkSpaces: remote staff desktops.\n- AppStream 2.0: deliver one application.\n- IoT Core: connected devices.",
    ),
    whenNotToUse: md(
      "Don't build new work on a service closed to new customers; pick the current alternative (the AWS docs name it). Don't use WorkSpaces when you need only one application (use AppStream 2.0), or X-Ray for metrics and alarms (use CloudWatch).",
    ),
    commonMistakes: [
      "Assuming every service is still open to new customers.",
      "Confusing CodeDeploy (deployment) with CodePipeline (orchestration) or CodeBuild (build/test).",
      "Mixing up X-Ray (tracing requests) with CloudTrail (API audit) and CloudWatch (metrics/logs).",
      "Choosing WorkSpaces when AppStream 2.0 would stream just one app.",
      "Mixing up CDK (infrastructure in code, synthesised to CloudFormation, idempotent) and the SDKs (API calls from your app, not idempotent).",
      "Changing a stack-managed resource by hand and creating drift, instead of updating the template.",
      "Thinking Elastic Beanstalk hides the underlying resources; it creates EC2, load balancers and more that you can still see and change.",
      "Storing database passwords in plain environment variables or code instead of Secrets Manager.",
      "Picking Elastic Transcoder (legacy) or MediaConnect (live transport) for file transcoding; MediaConvert is the current choice.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "List which Code* service builds, which deploys and which orchestrates." },
      { difficulty: "Medium", prompt: "A slow API call crosses five microservices. Explain how X-Ray would help find the bottleneck." },
      { difficulty: "Medium", prompt: "Pick WorkSpaces, WorkSpaces Secure Browser or AppStream 2.0 for three different scenarios." },
      { difficulty: "Hard", prompt: "Design a release pipeline with a manual approval step and blue/green deployment, naming each AWS service." },
      { difficulty: "Easy", prompt: "Write a minimal CloudFormation YAML template that creates one S3 bucket, and name the three top-level keys you used." },
      { difficulty: "Medium", prompt: "Explain what happens if you run a CDK app that defines one EC2 instance three times, versus an SDK script that calls RunInstances three times." },
      { difficulty: "Medium", prompt: "Pick an Elastic Beanstalk environment tier and deployment policy for (a) a public website that must never go fully offline during deploys, (b) a background image-processing service." },
    ],
    interviewQuestions: [
      { question: "Exam-style: Which service traces requests across a distributed application?", answer: "AWS X-Ray." },
      { question: "Exam-style: Which service automates the release process from source to deployment?", answer: "AWS CodePipeline." },
      { question: "Exam-style: Which service provides virtual desktops in the cloud?", answer: "Amazon WorkSpaces." },
      { question: "Exam-style: Which service streams a single desktop application to a web browser?", answer: "Amazon AppStream 2.0." },
      { question: "Exam-style: Which service tests mobile apps on real devices?", answer: "AWS Device Farm." },
      { question: "Exam-style: Which service lets you run code on devices locally and connect them to AWS?", answer: "AWS IoT Greengrass (with IoT Core for cloud connectivity)." },
      { question: "Exam-style: Which service provides a browser-based CLI?", answer: "AWS CloudShell." },
      { question: "Exam-style: Which service lets you define infrastructure in JSON or YAML templates?", answer: "AWS CloudFormation." },
      { question: "Exam-style: Which service lets developers define infrastructure using familiar programming languages?", answer: "The AWS Cloud Development Kit (CDK), which synthesizes CloudFormation templates." },
      { question: "Exam-style: A developer wants to upload code and have AWS provision servers, load balancing and scaling automatically. Which service?", answer: "AWS Elastic Beanstalk." },
      { question: "Exam-style: Which service stores database credentials and rotates them automatically?", answer: "AWS Secrets Manager." },
      { question: "Exam-style: Where can a company buy and deploy third-party software that runs on AWS?", answer: "AWS Marketplace." },
      { question: "Exam-style: Which service hosts full-stack web and mobile apps with a managed backend and CI/CD?", answer: "AWS Amplify." },
      { question: "Exam-style: Which service converts video files into formats for different devices?", answer: "AWS Elemental MediaConvert." },
      { question: "What are the two Elastic Beanstalk environment tiers?", answer: "Web server (handles HTTP requests) and worker (processes background jobs from an SQS queue)." },
    ],
    prerequisites: ["interacting-with-aws", "serverless-and-containers"],
    relatedTopics: ["interacting-with-aws", "serverless-and-containers", "application-integration", "monitoring-and-auditing", "governance-and-management"],
    keywords: ["cloudshell", "cloud9", "codecommit", "codebuild", "codedeploy", "codepipeline", "x-ray", "appconfig", "amplify", "appsync", "device farm", "workspaces", "appstream", "iot core", "greengrass", "ci/cd", "infrastructure as code", "cloudformation", "cdk", "sam", "stack", "drift", "infrastructure composer", "elastic beanstalk", "blue/green", "secrets manager", "parameter store", "aws toolkit", "marketplace", "mediaconvert", "connect", "workmail", "quick starts"],
  },

  {
    id: "governance-and-management",
    title: "Governance and Management Services",
    level: "intermediate",
    description: "Config, Control Tower, Systems Manager, Service Catalog, License Manager, Compute Optimizer, Resource Groups, Launch Wizard, Health and Audit Manager.",
    explanation: md(
      "As accounts and resources multiply, you must keep them compliant, tidy and efficient. These services help you **govern** (set and check rules) and **manage** (operate and optimise) your environment. They complement CloudWatch, CloudTrail and Trusted Advisor from the monitoring lesson.",
      "- **AWS Config**: records resource configuration over time and checks it against rules (for example 'all S3 buckets must be encrypted').\n- **AWS Control Tower**: sets up and governs a secure multi-account environment (a *landing zone*) with **controls** (formerly guardrails) built on Organizations, SCPs and Config.\n- **AWS Systems Manager**: operations hub for fleets: Session Manager (shell without opening SSH), Patch Manager, Run Command, Parameter Store and Inventory.\n- **AWS Service Catalog**: a catalog of pre-approved products (CloudFormation templates) users can launch without broad permissions.\n- **AWS License Manager**: tracks software licenses and enforces usage limits across AWS and on-premises.\n- **AWS Compute Optimizer**: analyses utilisation and recommends right-sized EC2, EBS, Lambda and other resources.\n- **AWS Resource Groups and Tag Editor**: group resources by tags and bulk-edit tags across Regions.\n- **AWS Launch Wizard**: guided, best-practice deployment of enterprise workloads such as SQL Server or SAP on AWS.\n- **AWS Health Dashboard**: a personal view of events affecting *your* resources (plus the **AWS Health API** to integrate alerts) and a service-health view of AWS overall.\n- **AWS Audit Manager**: continuously collects evidence to help you prepare for audits against frameworks.\n- **IAM access reports**: last-accessed data and credential reports that show unused permissions.",
      "Remember the split: **CloudTrail** = *who did what*. **Config** = *what does it look like, and was it compliant*. **CloudWatch** = *how is it performing*.",
      "**AWS Organizations and multi-account setups**",
      "- Signing up creates an **AWS account** plus its **root user**. An account is a container for resources and billing, not a person.\n- **AWS Organizations** creates accounts and manages them centrally: **consolidated billing**, access control, compliance, security and resource sharing.\n- The **management account** (formerly 'master account') owns the organization. Don't confuse it with the **root user** (the all-powerful sign-in in every account) or the **root** of the organization tree (the top container).\n- **Organizational units (OUs)** group accounts and can be nested into a hierarchy, for example Security, Prod and Dev OUs.\n- **Service control policies (SCPs)** set the *maximum* permissions for accounts in the organization, an OU or selected accounts. They never grant permissions; IAM must still allow the action. SCPs are the tool for organisation-wide guardrails such as 'only these Regions may be used' for data residency. (Inside one account, an IAM policy with an explicit deny on other Regions does the same for its users and roles.)\n- **Tag policies** standardise tag keys and values across the organization.\n- Best practice for serious workloads: **multiple accounts** that isolate environments or teams.",
      "**AWS Control Tower** (it replaced the retired AWS Landing Zone solution) gives you:",
      "- A **landing zone**: a well-architected baseline with sign-in through IAM Identity Center, centralised CloudTrail logs in a separate log archive account, and a security audit account.\n- **Account Factory**: automated, standard account creation with pre-approved network and Region settings, offered self-service through AWS Service Catalog.\n- **Controls** (formerly guardrails): pre-packaged *preventive* (SCP-based) and *detective* (Config-based) rules for the whole organization or chosen OUs.",
      "**AWS Config as compliance as code**",
      "**Change management** is a formal process to monitor, enforce and remediate changes; **compliance as code** automates it. Config records resource configurations and changes and checks them against **Config rules**. You get a resource inventory, a timeline of when each resource was or wasn't compliant, and help spotting security weaknesses. Key facts:",
      "- It is enabled **per Region**.\n- Rules are AWS **managed rules** or **custom rules** backed by your own Lambda function. They run on each configuration change or periodically (for example flagging resources created outside an approved Region).\n- Rules can trigger notifications or **auto-remediation**, such as a Systems Manager Automation runbook that puts a resource back into the desired state.\n- **Conformance packs** bundle rules and remediations (deployed as CloudFormation templates) for frameworks such as CIS or NIST. Config charges per rule evaluation, so remove packs you don't need.",
      "**Tags and Resource Groups**: a tag is a key-value pair on a resource (an EC2 instance's display name is just its `Name` tag). Tags drive organisation, cost allocation and budgets, operations (for example marking mission-critical systems), security classification, compliance and automation. They can also appear in IAM policy conditions (attribute-based access control).",
      "**AWS Resource Groups** collect resources that share tags or belong to the same CloudFormation stack, so you can view and act on them together, from the Resource Groups & Tag Editor console or Systems Manager.",
      "**More Systems Manager**:",
      "- **Session Manager** (and EC2 Instance Connect) give a shell without managing SSH keys.\n- **Automation** runbooks can, for example, build a freshly patched custom AMI every night.\n- **AppConfig** safely deploys configuration changes and feature flags with validators, monitored rollouts and automatic rollback.",
    ),
    analogy:
      "Running many AWS accounts is like managing an apartment building. Control Tower is the building code. Config is the inspector comparing each flat to it. Systems Manager is the maintenance crew with master keys. Service Catalog is the approved furniture list. Compute Optimizer points out flats too big for their tenants. Health Dashboard is the notice board of repairs affecting your floor.",
    examples: [
      {
        title: "A Config rule check from the CLI",
        language: "bash",
        code: `# Which resources break the managed rule that requires S3 encryption?
aws configservice get-compliance-details-by-config-rule \\
  --config-rule-name s3-bucket-server-side-encryption-enabled \\
  --compliance-types NON_COMPLIANT`,
        explanation: "Config keeps a history, so you can see not only the current state but also when a resource drifted out of compliance.",
      },
      {
        title: "Tag standard that Resource Groups can use",
        language: "text",
        code: `Key            Value
-------------  ------------------
Environment    prod | staging | dev
CostCenter     4213
Owner          payments-team
Application    checkout`,
        explanation: "Consistent tags let Resource Groups, Tag Editor and cost allocation reports slice resources the same way.",
      },
    ],
    howItWorks: md(
      "**Config** snapshots a resource whenever it changes, stores it as a configuration item, and runs managed or custom rules against it, optionally triggering remediation. **Control Tower** applies preventive controls (SCPs) and detective controls (Config rules) to accounts it provisions. **Systems Manager** uses an agent on instances (or managed nodes), so you can patch and run commands without inbound ports.",
      "**Compute Optimizer** reads CloudWatch utilisation metrics and uses machine learning to suggest cheaper or better-fitting resource types. **Health Dashboard** pushes events (maintenance, outages) affecting your resources, and the Health API can feed them to chat or ticketing tools.",
    ),
    diagram: `  Organizations ── Control Tower (landing zone + controls)
        |
   accounts ── Config (what changed / compliant?) ── Audit Manager (evidence)
        |
   fleets ──── Systems Manager (patch, run, session, parameters)
        |
   cost/size ─ Compute Optimizer, License Manager, tags + Resource Groups
   alerts ──── Health Dashboard / Health API`,
    whyItExists: md(
      "Manual checks don't scale across hundreds of resources and many accounts. These services automate compliance checks, standard setup, patching and optimisation, so governance is continuous instead of an annual scramble.",
    ),
    whenToUse: md(
      "- Config: compliance rules and change history.\n- Control Tower: start a multi-account setup.\n- Systems Manager: patch and administer instances.\n- Service Catalog: offer approved stacks.\n- Compute Optimizer: rightsize.\n- License Manager: track licenses.\n- Health Dashboard: stay ahead of events affecting you.",
    ),
    whenNotToUse: md(
      "Don't use Config as a performance monitor (use CloudWatch) or an API audit log (use CloudTrail). Don't use Control Tower for one small account where plain Organizations or IAM rules are enough.",
    ),
    commonMistakes: [
      "Confusing Config (resource configuration and compliance) with CloudTrail (API activity).",
      "Opening SSH ports for administration when Systems Manager Session Manager avoids it.",
      "Believing Compute Optimizer changes resources for you - it only recommends.",
      "Not tagging resources, which makes Resource Groups and cost allocation weak.",
      "Thinking an SCP grants permissions; it only sets the maximum, and IAM must still allow the action.",
      "Calling the management account the 'root account' and confusing it with the root user.",
      "Enabling Config in one Region and assuming every Region is covered.",
      "Leaving unused conformance packs running and paying for every rule evaluation.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "For each of the eleven services, write one sentence on its job." },
      { difficulty: "Medium", prompt: "Explain how Config, CloudTrail and CloudWatch each help investigate an unexpectedly open S3 bucket." },
      { difficulty: "Medium", prompt: "Define a tagging standard for a company and say which services benefit from it." },
      { difficulty: "Medium", prompt: "Write the idea of an SCP that blocks all Regions except one for every account in a 'Prod' OU, and explain why users still need IAM permissions." },
      { difficulty: "Hard", prompt: "Plan a landing zone for production, development and security accounts using Control Tower controls." },
    ],
    interviewQuestions: [
      { question: "Exam-style: Which service evaluates resource configurations against desired rules and records changes over time?", answer: "AWS Config." },
      { question: "Exam-style: Which service sets up a governed multi-account environment with controls (formerly guardrails)?", answer: "AWS Control Tower." },
      { question: "Exam-style: Which service lets administrators patch and run commands on many instances without SSH?", answer: "AWS Systems Manager." },
      { question: "Exam-style: Which service provides recommendations to rightsize EC2 instances?", answer: "AWS Compute Optimizer." },
      { question: "Exam-style: Which service lets administrators offer approved, pre-configured products to users?", answer: "AWS Service Catalog." },
      { question: "Exam-style: Which service shows events that affect your specific AWS resources?", answer: "AWS Health Dashboard, account health view (formerly the Personal Health Dashboard)." },
      { question: "Exam-style: Which service helps collect evidence for audits?", answer: "AWS Audit Manager." },
      { question: "Exam-style: Which service tracks software license usage?", answer: "AWS License Manager." },
      { question: "Exam-style: Which feature of AWS Organizations restricts the maximum permissions of member accounts, for example to approved Regions only?", answer: "Service control policies (SCPs)." },
      { question: "Exam-style: Which AWS Organizations feature combines bills from many accounts into one payment?", answer: "Consolidated billing." },
      { question: "Exam-style: Which Control Tower feature automates provisioning of new standardised accounts?", answer: "Account Factory." },
      { question: "Exam-style: Which service lets you group resources that share tags and act on them together?", answer: "AWS Resource Groups (with Tag Editor)." },
      { question: "Exam-style: How can a company apply a packaged set of Config rules for a framework like CIS?", answer: "Deploy an AWS Config conformance pack." },
      { question: "What is the difference between the management account and the root user?", answer: "The management account is the AWS account that owns an organization; the root user is the all-powerful sign-in identity that exists in every AWS account." },
    ],
    prerequisites: ["monitoring-and-auditing", "security-services"],
    relatedTopics: ["monitoring-and-auditing", "security-services", "pricing-and-billing", "developer-and-end-user-tools", "support-and-partner-resources"],
    keywords: ["config", "control tower", "systems manager", "service catalog", "license manager", "compute optimizer", "resource groups", "tag editor", "launch wizard", "health dashboard", "audit manager", "landing zone", "governance", "organizations", "management account", "organizational unit", "ou", "scp", "service control policy", "consolidated billing", "account factory", "controls", "guardrails", "conformance pack", "compliance as code", "tags", "tag policy", "appconfig", "session manager", "multi-account"],
  },
];
