import type { ExamQuestion } from '../../types';

export const technologyMoreQuestions: ExamQuestion[] = [
  {
    id: 'tech-101',
    domain: 'technology-services',
    question:
      'A company stores application log files in Amazon S3. Analysts want to run ad hoc SQL queries directly on those files, without loading the data anywhere or managing servers, and pay based on the data each query scans. Which AWS service should the company use?',
    options: ['Amazon Redshift', 'Amazon EMR', 'Amazon Athena', 'AWS Glue'],
    answer: [2],
    explanation:
      '**Amazon Athena** is a serverless, interactive query service that runs standard SQL directly against data in Amazon S3, and you pay for the data scanned by each query. Amazon Redshift is a data warehouse designed mainly for loaded, structured data. Amazon EMR runs big data frameworks such as Spark, and AWS Glue is an ETL and data catalog service rather than an ad hoc SQL query tool.',
  },
  {
    id: 'tech-102',
    domain: 'technology-services',
    question:
      'A data engineering team runs large Apache Spark and Apache Hadoop jobs on premises and wants a managed AWS service for running these open-source big data frameworks. Which service should the team use?',
    options: ['Amazon EMR', 'Amazon Athena', 'Amazon QuickSight', 'Amazon Data Firehose'],
    answer: [0],
    explanation:
      '**Amazon EMR** is a managed big data platform for running open-source frameworks such as Apache Spark, Hadoop, Hive, and Presto. Athena runs serverless SQL queries on S3 data, QuickSight builds business intelligence dashboards, and Data Firehose delivers streaming data to destinations; none of them runs Spark or Hadoop clusters.',
  },
  {
    id: 'tech-103',
    domain: 'technology-services',
    question:
      'A company wants to build a secure data lake on Amazon S3 and centrally manage fine-grained access permissions, down to the table and column level, for the analytics services that use it. Which AWS service is designed for this?',
    options: ['Amazon Macie', 'Amazon Redshift', 'AWS DataSync', 'AWS Lake Formation'],
    answer: [3],
    explanation:
      '**AWS Lake Formation** helps you build, secure, and manage data lakes, with centralized fine-grained permissions (database, table, column, and row level) for analytics services. Amazon Macie discovers sensitive data in S3, Amazon Redshift is a data warehouse, and AWS DataSync moves data; none of them centrally governs data lake permissions.',
  },
  {
    id: 'tech-104',
    domain: 'technology-services',
    question: 'Which of the following are capabilities of AWS Glue? (Choose two.)',
    options: [
      'Creating interactive business intelligence dashboards',
      'Running serverless extract, transform, and load (ETL) jobs',
      'Hosting a managed Apache Kafka cluster',
      'Maintaining a Data Catalog of table metadata for data in Amazon S3',
      'Converting speech in audio files into text',
    ],
    answer: [1, 3],
    explanation:
      '**AWS Glue** is a serverless data integration service: it runs **ETL jobs** and maintains the **AWS Glue Data Catalog**, a central metadata store that services such as Athena use to query S3 data. Dashboards are built with Amazon QuickSight, managed Kafka is Amazon MSK, and speech-to-text is Amazon Transcribe.',
  },
  {
    id: 'tech-105',
    domain: 'technology-services',
    question:
      'A gaming company needs to ingest a continuous stream of player click events in real time. Several different applications must read the same events independently, and the data must be replayable for a period of time. Which service best meets these requirements?',
    options: ['Amazon SQS', 'Amazon Kinesis Data Streams', 'Amazon SNS', 'AWS Step Functions'],
    answer: [1],
    explanation:
      '**Amazon Kinesis Data Streams** stores ordered records for a retention period, so multiple consumer applications can read the same data independently and replay it. With Amazon SQS, a message is processed by a consumer and then deleted, so it is not designed for many independent readers or replay. Amazon SNS pushes messages without storing them for replay, and Step Functions orchestrates workflows.',
  },
  {
    id: 'tech-106',
    domain: 'technology-services',
    question:
      'A company wants to capture streaming data and automatically deliver it to Amazon S3 and Amazon Redshift with minimal administration and no custom consumer code. Which service should it use?',
    options: ['Amazon Kinesis Data Streams', 'Amazon SQS', 'Amazon Data Firehose', 'Amazon MQ'],
    answer: [2],
    explanation:
      '**Amazon Data Firehose** (formerly Kinesis Data Firehose) is a fully managed service that loads streaming data into destinations such as Amazon S3, Amazon Redshift, and Amazon OpenSearch Service, scaling automatically. Kinesis Data Streams requires you to build consumers that read and write the data. Amazon SQS and Amazon MQ are messaging services, not delivery pipelines into analytics stores.',
  },
  {
    id: 'tech-107',
    domain: 'technology-services',
    question:
      'Business users want to build interactive dashboards and visualizations from data in Amazon Redshift and Amazon Athena and share them across the organization. Which AWS service should they use?',
    options: ['Amazon QuickSight', 'Amazon CloudWatch', 'AWS Glue', 'Amazon EMR'],
    answer: [0],
    explanation:
      '**Amazon QuickSight** is a serverless business intelligence (BI) service for building and sharing interactive dashboards from many data sources, including Redshift and Athena. CloudWatch dashboards show operational metrics, not business analytics. AWS Glue prepares and catalogs data, and Amazon EMR processes big data; neither is a BI visualization tool.',
  },
  {
    id: 'tech-108',
    domain: 'technology-services',
    question:
      'A company wants to ingest application logs, run near real-time log analytics and full-text search on them, and visualize the results in dashboards. Which service is best suited?',
    options: ['Amazon Kendra', 'Amazon OpenSearch Service', 'Amazon Redshift', 'Amazon Athena'],
    answer: [1],
    explanation:
      '**Amazon OpenSearch Service** is a managed service for log analytics, real-time application monitoring, and full-text search, with OpenSearch Dashboards for visualization. Amazon Kendra is an ML-powered enterprise search service for finding answers in documents, not a log analytics engine. Redshift is a data warehouse, and Athena runs ad hoc SQL on S3 rather than near real-time search.',
  },
  {
    id: 'tech-109',
    domain: 'technology-services',
    question:
      'A retailer wants to combine years of structured sales data from several sources and run complex analytical SQL queries for business intelligence reporting. Which AWS service is a fully managed data warehouse built for this workload?',
    options: ['Amazon RDS for MySQL', 'Amazon DynamoDB', 'Amazon ElastiCache', 'Amazon Redshift'],
    answer: [3],
    explanation:
      '**Amazon Redshift** is a fully managed, petabyte-scale data warehouse that uses columnar storage for fast analytical (OLAP) queries. Amazon RDS is optimized for transactional (OLTP) workloads, DynamoDB is a NoSQL key-value database, and ElastiCache is an in-memory cache.',
  },
  {
    id: 'tech-110',
    domain: 'technology-services',
    question:
      'A company runs Apache Kafka on premises and wants to move to AWS while keeping its existing Kafka applications and APIs unchanged, without managing the Kafka infrastructure itself. Which service should it choose?',
    options: [
      'Amazon Kinesis Data Streams',
      'Amazon MQ',
      'Amazon Managed Streaming for Apache Kafka (Amazon MSK)',
      'Amazon SQS',
    ],
    answer: [2],
    explanation:
      '**Amazon MSK** is a fully managed service for Apache Kafka, so existing Kafka clients and code keep working. Kinesis Data Streams is a different streaming service with its own APIs, so applications would need changes. Amazon MQ is a managed broker for ActiveMQ and RabbitMQ, and Amazon SQS is a message queue.',
  },
  {
    id: 'tech-111',
    domain: 'technology-services',
    question:
      'Which AWS services are designed for ingesting real-time streaming data at scale? (Choose two.)',
    options: [
      'Amazon Kinesis Data Streams',
      'AWS Glue Data Catalog',
      'Amazon Managed Streaming for Apache Kafka (Amazon MSK)',
      'Amazon QuickSight',
      'AWS Lake Formation',
    ],
    answer: [0, 2],
    explanation:
      '**Amazon Kinesis Data Streams** and **Amazon MSK** both ingest and store high-volume streaming data in real time. The Glue Data Catalog stores metadata about datasets, QuickSight visualizes data, and Lake Formation governs data lake access; none of them is a streaming ingestion service.',
  },
  {
    id: 'tech-112',
    domain: 'technology-services',
    question:
      'A team of data scientists wants to build, train, and deploy its own custom machine learning models by using a fully managed service with notebooks and managed training infrastructure. Which service should it use?',
    options: ['Amazon SageMaker AI', 'Amazon Bedrock', 'Amazon Rekognition', 'Amazon Comprehend'],
    answer: [0],
    explanation:
      '**Amazon SageMaker AI** is a fully managed service for the complete ML lifecycle: preparing data, building, training, tuning, and deploying custom models. Amazon Bedrock provides access to existing foundation models rather than building your own models from scratch. Rekognition and Comprehend are pre-trained AI services for images/video and text.',
  },
  {
    id: 'tech-113',
    domain: 'technology-services',
    question:
      'A company wants to build a generative AI application using foundation models from several providers, such as Anthropic, Meta, and Amazon, through a single API without managing any infrastructure. Which service should it use?',
    options: ['Amazon SageMaker AI', 'Amazon Lex', 'Amazon Kendra', 'Amazon Bedrock'],
    answer: [3],
    explanation:
      '**Amazon Bedrock** is a fully managed, serverless service that offers foundation models from leading AI companies and Amazon through a single API. SageMaker AI is for building, training, and hosting ML models, which involves more infrastructure choices. Amazon Lex builds chatbots, and Amazon Kendra is an enterprise search service.',
  },
  {
    id: 'tech-114',
    domain: 'technology-services',
    question:
      'Developers want a generative AI assistant inside their IDE that can suggest code, explain existing code, and answer questions about AWS. Which service provides this?',
    options: ['Amazon Q Business', 'Amazon Q Developer', 'Amazon Bedrock', 'AWS CodeBuild'],
    answer: [1],
    explanation:
      '**Amazon Q Developer** is a generative AI assistant for software development that works in IDEs, the command line, and the AWS Management Console. Amazon Q Business answers employee questions using company data, not coding. Amazon Bedrock is a platform for building your own generative AI apps, and CodeBuild compiles and tests code.',
  },
  {
    id: 'tech-115',
    domain: 'technology-services',
    question:
      'Which AWS services are designed specifically for building or using generative AI capabilities? (Choose two.)',
    options: ['Amazon Athena', 'Amazon Bedrock', 'Amazon Q', 'AWS CloudTrail', 'AWS Glue'],
    answer: [1, 2],
    explanation:
      '**Amazon Bedrock** gives access to foundation models for building generative AI applications, and **Amazon Q** is a generative AI-powered assistant for developers and businesses. Athena is a SQL query service, CloudTrail records API activity, and Glue is a data integration (ETL) service.',
  },
  {
    id: 'tech-116',
    domain: 'technology-services',
    question:
      'A company wants employees to search thousands of internal documents stored in Amazon S3, SharePoint, and other repositories by asking natural language questions. Which ML-powered intelligent search service meets this need?',
    options: ['Amazon Textract', 'Amazon Comprehend', 'Amazon Kendra', 'Amazon Personalize'],
    answer: [2],
    explanation:
      '**Amazon Kendra** is an intelligent enterprise search service that uses ML to return relevant answers to natural language questions, with connectors for sources such as S3 and SharePoint. Textract extracts text from documents, Comprehend analyzes text for insights such as sentiment and entities, and Personalize generates recommendations.',
  },
  {
    id: 'tech-117',
    domain: 'technology-services',
    question:
      'A social media app needs to automatically detect objects, scenes, and inappropriate content in images uploaded by users. Which AWS service should it use?',
    options: ['Amazon Rekognition', 'Amazon Textract', 'Amazon Comprehend', 'Amazon Polly'],
    answer: [0],
    explanation:
      '**Amazon Rekognition** analyzes images and videos to detect objects, scenes, faces, and unsafe content (content moderation). Textract extracts text and data from documents, Comprehend analyzes text, and Polly converts text to speech.',
  },
  {
    id: 'tech-118',
    domain: 'technology-services',
    question:
      'An insurance company receives scanned claim forms and wants to automatically extract printed and handwritten text, form fields, and tables from them. Which service is purpose-built for this?',
    options: ['Amazon Rekognition', 'Amazon Comprehend', 'Amazon Transcribe', 'Amazon Textract'],
    answer: [3],
    explanation:
      '**Amazon Textract** extracts text, handwriting, key-value pairs from forms, and tables from scanned documents. Rekognition is for image and video analysis and does not understand form and table structure. Comprehend analyzes text that has already been extracted, and Transcribe converts speech to text.',
  },
  {
    id: 'tech-119',
    domain: 'technology-services',
    question:
      'A company wants to analyze thousands of customer reviews to determine whether each one is positive, negative, neutral, or mixed. Which service should it use?',
    options: ['Amazon Translate', 'Amazon Comprehend', 'Amazon Lex', 'Amazon Kendra'],
    answer: [1],
    explanation:
      '**Amazon Comprehend** is a natural language processing (NLP) service that performs sentiment analysis and detects entities, key phrases, and language in text. Translate converts text between languages, Lex builds conversational chatbots, and Kendra provides intelligent document search.',
  },
  {
    id: 'tech-120',
    domain: 'technology-services',
    question:
      'A company receives scanned PDF contracts. It wants to extract the text from them and then identify entities such as people, organizations, and dates in that text. Which services should it use? (Choose two.)',
    options: [
      'Amazon Textract',
      'Amazon Polly',
      'Amazon Lex',
      'Amazon Rekognition',
      'Amazon Comprehend',
    ],
    answer: [0, 4],
    explanation:
      '**Amazon Textract** extracts the text from the scanned documents, and **Amazon Comprehend** then detects entities such as people, organizations, and dates in that text. Polly converts text to speech, Lex builds chatbots, and Rekognition analyzes images and video rather than document structure.',
  },
  {
    id: 'tech-121',
    domain: 'technology-services',
    question:
      'A company wants to build a chatbot that understands customer intent in both text and voice conversations on its website and in its contact center. Which service should it use?',
    options: ['Amazon Polly', 'Amazon Transcribe', 'Amazon Lex', 'Amazon Translate'],
    answer: [2],
    explanation:
      '**Amazon Lex** builds conversational interfaces (chatbots and voice bots) using automatic speech recognition and natural language understanding to identify intent. Polly only turns text into speech, Transcribe only turns speech into text, and Translate converts between languages; none of them manages a conversation.',
  },
  {
    id: 'tech-122',
    domain: 'technology-services',
    question:
      'A company is building an application that converts recorded customer phone calls into text for archiving and reads written responses aloud to customers in a natural-sounding voice. Which services should it use? (Choose two.)',
    options: [
      'Amazon Comprehend',
      'Amazon Transcribe',
      'Amazon Textract',
      'Amazon Polly',
      'Amazon Translate',
    ],
    answer: [1, 3],
    explanation:
      '**Amazon Transcribe** converts speech to text, and **Amazon Polly** converts text into lifelike speech. Comprehend analyzes text for meaning and sentiment, Textract extracts text from documents, and Translate converts text between languages.',
  },
  {
    id: 'tech-123',
    domain: 'technology-services',
    question:
      'An e-commerce company wants to automatically localize its product descriptions from English into several other languages. Which service should it use?',
    options: ['Amazon Translate', 'Amazon Transcribe', 'Amazon Comprehend', 'Amazon Polly'],
    answer: [0],
    explanation:
      '**Amazon Translate** is a neural machine translation service for translating text between languages. Transcribe converts speech to text, Comprehend analyzes text for insights such as sentiment, and Polly converts text to speech.',
  },
  {
    id: 'tech-124',
    domain: 'technology-services',
    question:
      'An online retailer wants to show each customer real-time product recommendations based on browsing and purchase history, without building machine learning models itself. Which service should it use?',
    options: ['Amazon Kendra', 'Amazon Rekognition', 'Amazon SageMaker AI', 'Amazon Personalize'],
    answer: [3],
    explanation:
      '**Amazon Personalize** is a fully managed service that trains recommendation models on your interaction data and serves real-time personalized recommendations, with no ML expertise required. SageMaker AI would require the company to build and train its own models. Kendra is enterprise search, and Rekognition analyzes images and video.',
  },
  {
    id: 'tech-125',
    domain: 'technology-services',
    question:
      'A startup with no machine learning expertise wants to add face detection to its mobile app as quickly as possible. Which approach requires the LEAST machine learning expertise?',
    options: [
      'Train a custom computer vision model with Amazon SageMaker AI',
      'Call the Amazon Rekognition API from the application',
      'Install an open-source vision framework on GPU-based Amazon EC2 instances',
      'Fine-tune a foundation model in Amazon Bedrock',
    ],
    answer: [1],
    explanation:
      '**Amazon Rekognition** is a pre-trained AI service, so the app can detect faces with a simple API call and no model training. Training a model in SageMaker AI, running your own framework on EC2, or fine-tuning a foundation model all require far more ML knowledge and effort.',
  },
  {
    id: 'tech-126',
    domain: 'technology-services',
    question:
      'An order-processing application must keep accepting orders during traffic spikes, even when the backend processing servers are slow or temporarily unavailable. Which service should be used to decouple the components by buffering the orders until they can be processed?',
    options: ['Amazon SNS', 'Amazon EventBridge', 'Amazon SQS', 'AWS Step Functions'],
    answer: [2],
    explanation:
      '**Amazon SQS** is a fully managed message queue that stores messages durably until consumers poll and process them, decoupling producers from slow or unavailable consumers. SNS and EventBridge push messages and events to targets rather than holding a backlog for consumers to pull. Step Functions orchestrates workflow steps, not message buffering.',
  },
  {
    id: 'tech-127',
    domain: 'technology-services',
    question:
      'A company wants to push a notification to many subscribers at once, including email addresses, mobile phones via SMS, and AWS Lambda functions, whenever an event occurs. Which service should it use?',
    options: ['Amazon SNS', 'Amazon SQS', 'Amazon MQ', 'Amazon Kinesis Data Streams'],
    answer: [0],
    explanation:
      '**Amazon SNS** is a publish/subscribe service that pushes each message to all subscribers of a topic, including email, SMS, Lambda, HTTP endpoints, and SQS queues. SQS is a queue that consumers poll, Amazon MQ is a managed message broker for existing applications, and Kinesis Data Streams is for streaming data.',
  },
  {
    id: 'tech-128',
    domain: 'technology-services',
    question:
      'A company wants to automatically route events from AWS services and from integrated third-party SaaS applications to different targets, based on rules that match the event content. Which service is designed for this?',
    options: ['Amazon SQS', 'Amazon MQ', 'Amazon AppFlow', 'Amazon EventBridge'],
    answer: [3],
    explanation:
      '**Amazon EventBridge** is a serverless event bus that receives events from AWS services, your applications, and SaaS partners, and uses rules to filter and route them to targets. SQS is a message queue without content-based routing rules, Amazon MQ is a managed broker for ActiveMQ and RabbitMQ, and AppFlow transfers data between SaaS apps and AWS.',
  },
  {
    id: 'tech-129',
    domain: 'technology-services',
    question:
      'A company wants each new order message to be delivered to several independent queues so that the billing, shipping, and analytics systems can process it in parallel (a fan-out pattern). Which services are typically combined to achieve this? (Choose two.)',
    options: ['AWS Step Functions', 'Amazon AppFlow', 'Amazon SNS', 'AWS Glue', 'Amazon SQS'],
    answer: [2, 4],
    explanation:
      'In the fan-out pattern, a message is published to an **Amazon SNS** topic, and multiple **Amazon SQS** queues subscribed to that topic each receive a copy for independent processing. Step Functions orchestrates workflows, AppFlow moves data between SaaS applications and AWS, and Glue performs ETL.',
  },
  {
    id: 'tech-130',
    domain: 'technology-services',
    question:
      'A company needs to coordinate several AWS Lambda functions into a multi-step workflow with branching, error handling, retries, and a visual view of each execution. Which service should it use?',
    options: ['Amazon SQS', 'AWS Step Functions', 'Amazon SNS', 'AWS CodePipeline'],
    answer: [1],
    explanation:
      '**AWS Step Functions** is a visual workflow service that orchestrates AWS services such as Lambda into state machines with branching, retries, and error handling. SQS and SNS are messaging services without workflow logic, and CodePipeline orchestrates software release pipelines, not application workflows.',
  },
  {
    id: 'tech-131',
    domain: 'technology-services',
    question:
      'A company is migrating an on-premises application that uses Apache ActiveMQ with industry-standard messaging APIs and protocols such as JMS, AMQP, and MQTT. It wants a managed message broker without rewriting its messaging code. Which service should it use?',
    options: ['Amazon SQS', 'Amazon SNS', 'Amazon MQ', 'Amazon EventBridge'],
    answer: [2],
    explanation:
      '**Amazon MQ** is a managed message broker service for Apache ActiveMQ and RabbitMQ that supports standard APIs and protocols, so existing applications can migrate with little or no code change. SQS, SNS, and EventBridge use their own AWS APIs, so the messaging code would need to be rewritten.',
  },
  {
    id: 'tech-132',
    domain: 'technology-services',
    question:
      'A sales team wants to regularly transfer data from Salesforce into Amazon S3 without writing custom integration code. Which service should it use?',
    options: [
      'Amazon AppFlow',
      'AWS DataSync',
      'AWS Transfer Family',
      'AWS Database Migration Service (AWS DMS)',
    ],
    answer: [0],
    explanation:
      '**Amazon AppFlow** is a fully managed integration service that securely transfers data between SaaS applications such as Salesforce and AWS services such as Amazon S3, on demand or on a schedule. DataSync moves files from storage systems, Transfer Family provides SFTP/FTPS/FTP endpoints, and DMS migrates databases.',
  },
  {
    id: 'tech-133',
    domain: 'technology-services',
    question:
      'A financial application sends transaction messages that must be processed exactly once and in the exact order in which they were sent. Which option meets this requirement?',
    options: [
      'Amazon SQS standard queue',
      'Amazon SNS standard topic',
      'Amazon EventBridge default event bus',
      'Amazon SQS FIFO queue',
    ],
    answer: [3],
    explanation:
      'An **Amazon SQS FIFO queue** preserves the exact order of messages and provides exactly-once processing. SQS standard queues offer at-least-once delivery with best-effort ordering, and SNS standard topics and the EventBridge event bus do not guarantee strict ordering.',
  },
  {
    id: 'tech-134',
    domain: 'technology-services',
    question:
      'A company wants to automate its release process so that every code change automatically moves through build, test, and deployment stages. Which service orchestrates this continuous delivery pipeline?',
    options: ['AWS CodeBuild', 'AWS CodePipeline', 'AWS CodeDeploy', 'AWS CodeArtifact'],
    answer: [1],
    explanation:
      '**AWS CodePipeline** is a continuous delivery service that models and automates the stages of a release process, calling other tools for each stage. CodeBuild only performs the build and test step, CodeDeploy only performs deployments, and CodeArtifact stores software packages.',
  },
  {
    id: 'tech-135',
    domain: 'technology-services',
    question:
      'A development team wants one fully managed service that compiles source code and runs unit tests, and another service that automates deploying the resulting application to Amazon EC2 instances and on-premises servers. Which services should it use? (Choose two.)',
    options: ['AWS CodeBuild', 'AWS CodeArtifact', 'AWS X-Ray', 'AWS CodeDeploy', 'AWS Config'],
    answer: [0, 3],
    explanation:
      '**AWS CodeBuild** is a fully managed build service that compiles code, runs tests, and produces artifacts, and **AWS CodeDeploy** automates deployments to EC2, on-premises servers, Lambda, and Amazon ECS. CodeArtifact is a package repository, X-Ray traces requests, and Config tracks resource configurations.',
  },
  {
    id: 'tech-136',
    domain: 'technology-services',
    question:
      'A company wants a managed, secure repository to store and share software packages, such as npm and Maven packages, used by its development teams. Which service should it use?',
    options: [
      'AWS CodeBuild',
      'Amazon Elastic Container Registry (Amazon ECR)',
      'AWS CodeArtifact',
      'AWS CodeDeploy',
    ],
    answer: [2],
    explanation:
      '**AWS CodeArtifact** is a managed artifact repository for software packages from formats such as npm, Maven, PyPI, and NuGet. Amazon ECR stores container images, CodeBuild compiles and tests code, and CodeDeploy deploys applications.',
  },
  {
    id: 'tech-137',
    domain: 'technology-services',
    question:
      'A microservices application has slow responses, and developers need to trace individual requests as they travel through multiple services to find the bottleneck. Which service should they use?',
    options: ['AWS X-Ray', 'AWS CloudTrail', 'AWS Config', 'Amazon Inspector'],
    answer: [0],
    explanation:
      '**AWS X-Ray** traces requests end to end through distributed applications and shows a service map with latency for each component. CloudTrail records API calls for auditing, Config records resource configuration changes, and Inspector scans for software vulnerabilities.',
  },
  {
    id: 'tech-138',
    domain: 'technology-services',
    question:
      'A developer wants a Python application to upload files to Amazon S3 by calling AWS APIs directly from the application code. What should the developer use?',
    options: [
      'The AWS Management Console',
      'AWS CloudShell',
      'AWS CloudFormation',
      'An AWS SDK, such as the AWS SDK for Python (Boto3)',
    ],
    answer: [3],
    explanation:
      'The **AWS SDKs** provide language-specific libraries, such as Boto3 for Python, for calling AWS services from application code. The Management Console is a web interface for people, CloudShell is a browser-based shell, and CloudFormation provisions infrastructure from templates rather than being called from application logic.',
  },
  {
    id: 'tech-139',
    domain: 'technology-services',
    question:
      'A company wants to quickly set up a new multi-account AWS environment (a landing zone) that follows AWS best practices and automatically applies preventive and detective controls. Which service should it use?',
    options: ['AWS Organizations', 'AWS Control Tower', 'AWS Config', 'AWS Service Catalog'],
    answer: [1],
    explanation:
      '**AWS Control Tower** automates the setup of a well-architected multi-account landing zone and applies controls (guardrails), building on AWS Organizations and other services. Organizations by itself groups accounts and applies policies but does not automatically set up a landing zone. Config evaluates resource compliance, and Service Catalog offers approved products for self-service.',
  },
  {
    id: 'tech-140',
    domain: 'technology-services',
    question: 'Which of the following are features of AWS Organizations? (Choose two.)',
    options: [
      'Recording the configuration history of AWS resources',
      'Consolidated billing for multiple AWS accounts',
      'Service control policies (SCPs) that set the maximum permissions for member accounts',
      'Patching operating systems on Amazon EC2 instances',
      'Tracing requests across microservices',
    ],
    answer: [1, 2],
    explanation:
      '**AWS Organizations** centrally manages multiple accounts, providing **consolidated billing** and **service control policies (SCPs)** that limit the maximum permissions in member accounts. Configuration history comes from AWS Config, OS patching from AWS Systems Manager, and request tracing from AWS X-Ray.',
  },
  {
    id: 'tech-141',
    domain: 'technology-services',
    question:
      'A security team wants to continuously record configuration changes to AWS resources and automatically flag any Amazon EBS volume that is not encrypted. Which service should it use?',
    options: ['AWS CloudTrail', 'AWS Systems Manager', 'AWS Config', 'AWS Trusted Advisor'],
    answer: [2],
    explanation:
      '**AWS Config** records resource configurations and their changes over time and evaluates them against **Config rules**, such as a rule that checks for encrypted EBS volumes. CloudTrail records API calls rather than evaluating configuration compliance, Systems Manager manages and operates resources, and Trusted Advisor gives periodic best-practice checks rather than continuous custom compliance rules.',
  },
  {
    id: 'tech-142',
    domain: 'technology-services',
    question:
      'A company wants to provision identical development, test, and production environments repeatedly by describing its AWS resources in template files. Which service should it use?',
    options: ['AWS CloudFormation', 'AWS Config', 'AWS Systems Manager', 'AWS Launch Wizard'],
    answer: [0],
    explanation:
      '**AWS CloudFormation** is an infrastructure as code (IaC) service that provisions resources consistently from JSON or YAML templates as stacks. AWS Config records and evaluates configurations but does not provision them, Systems Manager operates and manages existing resources, and Launch Wizard is a guided deployment tool for specific third-party applications.',
  },
  {
    id: 'tech-143',
    domain: 'technology-services',
    question:
      'An administrator needs to open secure shell sessions to Amazon EC2 instances without opening inbound SSH ports or managing bastion hosts. Which AWS capability provides this?',
    options: [
      'Amazon Inspector',
      'AWS Config',
      'AWS Direct Connect',
      'AWS Systems Manager Session Manager',
    ],
    answer: [3],
    explanation:
      '**Session Manager**, a capability of AWS Systems Manager, provides secure, auditable shell access to managed instances without opening inbound ports, managing SSH keys, or running bastion hosts. Inspector scans for vulnerabilities, Config records configurations, and Direct Connect is a dedicated network connection to AWS.',
  },
  {
    id: 'tech-144',
    domain: 'technology-services',
    question: 'Which tasks can be performed with AWS Systems Manager? (Choose two.)',
    options: [
      'Automating operating system patching across a fleet of instances',
      'Recording a history of API calls made in the account',
      'Setting up a multi-account landing zone',
      'Storing configuration data and parameters centrally',
      'Recommending optimal Amazon EC2 instance types',
    ],
    answer: [0, 3],
    explanation:
      '**AWS Systems Manager** includes **Patch Manager** for automating OS patching and **Parameter Store** for centrally storing configuration data and secrets. API call history comes from CloudTrail, landing zones are set up by Control Tower, and instance type recommendations come from Compute Optimizer.',
  },
  {
    id: 'tech-145',
    domain: 'technology-services',
    question:
      'A company wants machine learning-based recommendations for the optimal memory size of its AWS Lambda functions and better volume types for its Amazon EBS volumes, based on historical utilization. Which service provides this?',
    options: ['AWS Trusted Advisor', 'AWS Compute Optimizer', 'AWS Auto Scaling', 'AWS Health Dashboard'],
    answer: [1],
    explanation:
      '**AWS Compute Optimizer** uses machine learning on utilization metrics to recommend optimal configurations for EC2 instances, Auto Scaling groups, EBS volumes, Lambda functions, and more. Trusted Advisor runs broad best-practice checks rather than detailed ML-based rightsizing. AWS Auto Scaling adjusts capacity, and the Health Dashboard reports AWS events.',
  },
  {
    id: 'tech-146',
    domain: 'technology-services',
    question: 'Which of the following are categories of checks in AWS Trusted Advisor? (Choose two.)',
    options: [
      'Code quality',
      'Data labeling',
      'Cost optimization',
      'Application tracing',
      'Fault tolerance',
    ],
    answer: [2, 4],
    explanation:
      '**AWS Trusted Advisor** check categories include **cost optimization**, performance, security, **fault tolerance**, service limits, and operational excellence. Trusted Advisor does not review code quality, label data for ML, or trace application requests (that is AWS X-Ray).',
  },
  {
    id: 'tech-147',
    domain: 'technology-services',
    question:
      'A company wants automated checks that identify S3 buckets with open access permissions, idle load balancers, and service quotas that are close to their limits. Which service provides these best-practice checks?',
    options: ['AWS Compute Optimizer', 'Amazon Inspector', 'AWS Trusted Advisor', 'AWS Health Dashboard'],
    answer: [2],
    explanation:
      '**AWS Trusted Advisor** inspects your account and recommends improvements across cost, security, fault tolerance, performance, service limits, and operational excellence, including open S3 bucket permissions, idle resources, and quota usage. Compute Optimizer focuses on rightsizing compute resources, Inspector scans workloads for software vulnerabilities, and the Health Dashboard reports AWS service events.',
  },
  {
    id: 'tech-148',
    domain: 'technology-services',
    question:
      'An operations team wants to be notified about scheduled AWS maintenance and service events that specifically affect the resources in its own account. Which service provides this personalized view?',
    options: ['AWS Health Dashboard', 'Amazon CloudWatch', 'AWS Trusted Advisor', 'AWS CloudTrail'],
    answer: [0],
    explanation:
      'The **AWS Health Dashboard** shows the general status of AWS services and a personalized view of events, such as scheduled maintenance and issues, that affect your account and resources. CloudWatch monitors metrics and logs from your resources, Trusted Advisor gives best-practice recommendations, and CloudTrail records API activity.',
  },
  {
    id: 'tech-149',
    domain: 'technology-services',
    question:
      'A company wants to receive an email when the average CPU utilization of an Amazon EC2 instance stays above 80% for 10 minutes. Which solution meets this requirement?',
    options: [
      'An AWS CloudTrail trail that delivers logs to an Amazon S3 bucket',
      'An AWS Config rule with automatic remediation',
      'AWS X-Ray tracing enabled on the instance',
      'An Amazon CloudWatch alarm that publishes to an Amazon SNS topic',
    ],
    answer: [3],
    explanation:
      'An **Amazon CloudWatch alarm** watches a metric such as CPUUtilization against a threshold over a period and can notify an **Amazon SNS** topic with an email subscription. CloudTrail records API calls, Config evaluates configuration compliance, and X-Ray traces requests; none of them alarms on performance metrics.',
  },
  {
    id: 'tech-150',
    domain: 'technology-services',
    question:
      'A security auditor needs to determine which IAM user deleted an Amazon S3 bucket last week, including the time and source IP address of the request. Which service provides this information?',
    options: ['Amazon CloudWatch', 'AWS CloudTrail', 'AWS Config', 'Amazon Inspector'],
    answer: [1],
    explanation:
      '**AWS CloudTrail** records API activity in the account, including who made each call, when, and from which IP address. CloudWatch monitors metrics and logs, Config records the configuration state of resources rather than the caller details of each request, and Inspector scans for vulnerabilities.',
  },
  {
    id: 'tech-151',
    domain: 'technology-services',
    question:
      "A company wants to know who changed a security group's rules and also see how that security group was configured before and after the change. Which services should it use? (Choose two.)",
    options: [
      'Amazon CloudWatch',
      'AWS CloudTrail',
      'AWS Config',
      'AWS X-Ray',
      'AWS Trusted Advisor',
    ],
    answer: [1, 2],
    explanation:
      '**AWS CloudTrail** shows who made the API call that changed the security group, and **AWS Config** keeps the configuration history so you can compare the settings before and after the change. CloudWatch monitors metrics and logs, X-Ray traces application requests, and Trusted Advisor gives best-practice recommendations.',
  },
  {
    id: 'tech-152',
    domain: 'technology-services',
    question:
      'A central IT team wants to create a portfolio of approved, preconfigured AWS products, defined as infrastructure as code, that developers can deploy on their own while staying within company standards. Which service should it use?',
    options: ['AWS Control Tower', 'AWS Organizations', 'AWS Service Catalog', 'AWS Marketplace'],
    answer: [2],
    explanation:
      '**AWS Service Catalog** lets administrators create and manage catalogs of approved IT products (for example, CloudFormation templates) that users can provision in a self-service way. Control Tower sets up multi-account landing zones, Organizations manages accounts and policies, and AWS Marketplace is a catalog of third-party software.',
  },
  {
    id: 'tech-153',
    domain: 'technology-services',
    question:
      'A company wants to track and control how many Microsoft and Oracle software licenses it uses across AWS and on-premises servers so that it does not exceed its license agreements. Which service should it use?',
    options: ['AWS License Manager', 'AWS Artifact', 'AWS Service Catalog', 'AWS Trusted Advisor'],
    answer: [0],
    explanation:
      '**AWS License Manager** helps manage software licenses from vendors such as Microsoft, Oracle, and SAP across AWS and on premises, with rules that limit overuse. AWS Artifact provides AWS compliance reports and agreements, Service Catalog offers approved products for self-service, and Trusted Advisor gives best-practice checks.',
  },
  {
    id: 'tech-154',
    domain: 'technology-services',
    question:
      'A solutions architect wants to review a workload against AWS best practices across pillars such as security, reliability, and cost optimization, and then get an improvement plan. Which service should the architect use?',
    options: ['AWS Trusted Advisor', 'AWS Config', 'AWS Control Tower', 'AWS Well-Architected Tool'],
    answer: [3],
    explanation:
      'The **AWS Well-Architected Tool** lets you answer questions about a workload, compares it against the pillars of the AWS Well-Architected Framework, and produces an improvement plan. Trusted Advisor runs automated account-level checks rather than workload design reviews, Config evaluates resource configurations, and Control Tower governs multi-account environments.',
  },
  {
    id: 'tech-155',
    domain: 'technology-services',
    question:
      "An application's traffic rises sharply during business hours and drops overnight. The company wants capacity to be added and removed automatically so it maintains performance while paying only for what it needs. Which AWS service helps achieve this?",
    options: [
      'Elastic Load Balancing',
      'AWS Auto Scaling',
      'AWS Compute Optimizer',
      'AWS Trusted Advisor',
    ],
    answer: [1],
    explanation:
      '**AWS Auto Scaling** monitors applications and automatically adjusts capacity, adding resources during peaks and removing them when demand drops. Elastic Load Balancing distributes traffic but does not change capacity, and Compute Optimizer and Trusted Advisor only make recommendations.',
  },
  {
    id: 'tech-156',
    domain: 'technology-services',
    question:
      'A company wants a guided way to size, configure, and deploy third-party applications such as Microsoft SQL Server Always On or SAP systems on AWS, without manually identifying and provisioning each resource. Which service should it use?',
    options: [
      'AWS Service Catalog',
      'AWS Application Migration Service',
      'AWS Launch Wizard',
      'AWS Elastic Beanstalk',
    ],
    answer: [2],
    explanation:
      '**AWS Launch Wizard** guides you through sizing, configuring, and deploying third-party applications such as SQL Server and SAP on AWS, then provisions the resources. Service Catalog distributes products an administrator has already defined, Application Migration Service rehosts existing servers, and Elastic Beanstalk deploys your own web application code.',
  },
  {
    id: 'tech-157',
    domain: 'technology-services',
    question:
      'A company wants to rehost (lift and shift) hundreds of on-premises physical and virtual servers to Amazon EC2 with minimal downtime and without changing the applications. Which service should it use?',
    options: [
      'AWS Application Migration Service',
      'AWS Database Migration Service (AWS DMS)',
      'AWS DataSync',
      'AWS Transfer Family',
    ],
    answer: [0],
    explanation:
      '**AWS Application Migration Service** continuously replicates source servers to AWS and launches them as EC2 instances, enabling lift-and-shift migrations with minimal downtime. DMS migrates databases, DataSync transfers files and objects, and Transfer Family provides managed SFTP/FTPS/FTP endpoints.',
  },
  {
    id: 'tech-158',
    domain: 'technology-services',
    question:
      'A company wants to migrate its on-premises Oracle database to Amazon Aurora PostgreSQL while keeping the source database fully operational during the migration. Which service should it use?',
    options: [
      'AWS DataSync',
      'AWS Application Migration Service',
      'AWS Transfer Family',
      'AWS Database Migration Service (AWS DMS)',
    ],
    answer: [3],
    explanation:
      '**AWS DMS** migrates databases to AWS while the source remains operational, supporting both homogeneous and heterogeneous migrations such as Oracle to Aurora PostgreSQL (with schema conversion handled by DMS Schema Conversion or the AWS Schema Conversion Tool). DataSync moves files, Application Migration Service rehosts whole servers without changing engines, and Transfer Family handles file transfers over SFTP/FTPS/FTP.',
  },
  {
    id: 'tech-159',
    domain: 'technology-services',
    question:
      'A company wants to automate and accelerate a one-time online transfer of millions of files from an on-premises NFS file server to Amazon S3, and then run recurring scheduled transfers. Which service should it use?',
    options: ['AWS Storage Gateway', 'AWS DataSync', 'Amazon AppFlow', 'AWS Transfer Family'],
    answer: [1],
    explanation:
      '**AWS DataSync** is an online data transfer service that automates and accelerates moving data between on-premises storage (NFS, SMB, and others) and AWS storage services, with scheduling. Storage Gateway gives on-premises applications ongoing hybrid access to cloud storage rather than bulk migration. AppFlow moves SaaS application data, and Transfer Family provides SFTP/FTPS/FTP endpoints.',
  },
  {
    id: 'tech-160',
    domain: 'technology-services',
    question:
      "A company's business partners upload files using SFTP. The company wants these files stored directly in Amazon S3 without running its own SFTP servers. Which service should it use?",
    options: ['AWS DataSync', 'AWS Storage Gateway', 'AWS Transfer Family', 'Amazon AppFlow'],
    answer: [2],
    explanation:
      '**AWS Transfer Family** provides fully managed SFTP, FTPS, FTP, and AS2 endpoints that store files directly in Amazon S3 or Amazon EFS. DataSync is for moving data between storage systems rather than accepting partner SFTP uploads, Storage Gateway connects on-premises applications to cloud storage, and AppFlow integrates SaaS applications.',
  },
  {
    id: 'tech-161',
    domain: 'technology-services',
    question:
      'A company is moving an application to AWS. It wants to replicate its on-premises application servers to Amazon EC2 and continuously replicate its database into Amazon RDS, both with minimal downtime. Which services should it use? (Choose two.)',
    options: [
      'AWS Transfer Family',
      'AWS Application Migration Service',
      'Amazon AppFlow',
      'AWS Lake Formation',
      'AWS Database Migration Service (AWS DMS)',
    ],
    answer: [1, 4],
    explanation:
      '**AWS Application Migration Service** replicates and rehosts the application servers on EC2, and **AWS DMS** migrates the database into Amazon RDS with ongoing replication to minimize downtime. Transfer Family handles file transfers, AppFlow moves SaaS data, and Lake Formation governs data lakes.',
  },
  {
    id: 'tech-162',
    domain: 'technology-services',
    question:
      'A company wants to securely connect millions of sensors to AWS so that they can publish telemetry using the MQTT protocol, and then route those messages to other AWS services. Which service should it use?',
    options: ['AWS IoT Core', 'AWS IoT Greengrass', 'Amazon Kinesis Data Streams', 'Amazon SNS'],
    answer: [0],
    explanation:
      '**AWS IoT Core** lets devices connect securely to the cloud using protocols such as MQTT and HTTPS, and its rules engine routes messages to other AWS services. IoT Greengrass runs software on edge devices rather than acting as the cloud connection point, Kinesis Data Streams ingests streaming data but does not manage device connections, and SNS is a pub/sub notification service.',
  },
  {
    id: 'tech-163',
    domain: 'technology-services',
    question:
      'A factory wants its devices to connect securely to the cloud, and it also wants to run local processing and machine learning inference on edge devices that keep working when the internet connection drops. Which services should it use? (Choose two.)',
    options: [
      'Amazon WorkSpaces',
      'Amazon AppStream 2.0',
      'AWS Amplify',
      'AWS IoT Core',
      'AWS IoT Greengrass',
    ],
    answer: [3, 4],
    explanation:
      '**AWS IoT Core** securely connects devices to AWS, and **AWS IoT Greengrass** is an edge runtime that lets devices run code and ML inference locally, even while offline. WorkSpaces and AppStream 2.0 deliver desktops and applications to users, and Amplify builds web and mobile apps.',
  },
  {
    id: 'tech-164',
    domain: 'technology-services',
    question:
      'A company wants to give remote employees persistent, fully managed virtual Windows or Linux desktops that they can access from any supported device. Which service should it use?',
    options: [
      'Amazon AppStream 2.0',
      'Amazon WorkSpaces Secure Browser',
      'Amazon Connect',
      'Amazon WorkSpaces',
    ],
    answer: [3],
    explanation:
      '**Amazon WorkSpaces** provides fully managed, persistent virtual desktops (DaaS) for Windows and Linux users. AppStream 2.0 streams individual applications, WorkSpaces Secure Browser provides secure browser access to websites and web apps, and Amazon Connect is a contact center service.',
  },
  {
    id: 'tech-165',
    domain: 'technology-services',
    question:
      "A software training company wants to stream a single desktop application to users' web browsers, without providing each user a full virtual desktop. Which service should it use?",
    options: [
      'Amazon WorkSpaces',
      'Amazon AppStream 2.0',
      'AWS Amplify',
      'Amazon WorkSpaces Secure Browser',
    ],
    answer: [1],
    explanation:
      '**Amazon AppStream 2.0** is a fully managed application streaming service that delivers desktop applications to a web browser without a full desktop. WorkSpaces provides full virtual desktops, Amplify builds and hosts web and mobile apps, and WorkSpaces Secure Browser gives access to websites and web apps, not installed desktop applications.',
  },
  {
    id: 'tech-166',
    domain: 'technology-services',
    question:
      "A company wants contractors to access internal websites and SaaS applications through a secure, browser-based experience in which no company data is stored on the contractors' own devices. Which service is designed for this?",
    options: [
      'Amazon WorkSpaces',
      'Amazon AppStream 2.0',
      'Amazon WorkSpaces Secure Browser',
      'Amazon Connect',
    ],
    answer: [2],
    explanation:
      '**Amazon WorkSpaces Secure Browser** provides a fully managed, cloud-hosted browser for accessing internal websites and SaaS applications from existing local browsers, without data being stored on the device. WorkSpaces provides full virtual desktops and AppStream 2.0 streams desktop applications, which is more than this need. Amazon Connect is a contact center service.',
  },
  {
    id: 'tech-167',
    domain: 'technology-services',
    question:
      'A front-end developer wants to quickly build, host, and deploy a full-stack web application with a Git-based CI/CD workflow, without deep cloud expertise. Which service should the developer use?',
    options: ['AWS Amplify', 'AWS AppSync', 'Amazon API Gateway', 'AWS CodeArtifact'],
    answer: [0],
    explanation:
      '**AWS Amplify** provides tools and hosting to build, deploy, and host full-stack web and mobile apps, including Git-based CI/CD. AppSync creates managed GraphQL APIs, API Gateway creates and manages APIs, and CodeArtifact stores software packages; none of them hosts a full-stack app on its own.',
  },
  {
    id: 'tech-168',
    domain: 'technology-services',
    question:
      'Which AWS services can be used to create managed APIs that front-end web and mobile applications call? (Choose two.)',
    options: [
      'Amazon API Gateway',
      'Amazon SES',
      'AWS AppSync',
      'Amazon Connect',
      'AWS Glue',
    ],
    answer: [0, 2],
    explanation:
      '**Amazon API Gateway** creates, publishes, and secures REST, HTTP, and WebSocket APIs, and **AWS AppSync** creates managed GraphQL APIs for web and mobile apps. Amazon SES sends email, Amazon Connect is a contact center service, and AWS Glue is an ETL service.',
  },
  {
    id: 'tech-169',
    domain: 'technology-services',
    question:
      'A company wants to set up a cloud-based contact center so that its agents can handle customer phone calls and chats, with pay-as-you-go pricing and no telephony hardware to manage. Which service should it use?',
    options: ['Amazon Lex', 'Amazon SNS', 'Amazon Connect', 'Amazon WorkSpaces'],
    answer: [2],
    explanation:
      '**Amazon Connect** is an omnichannel cloud contact center service for voice and chat with pay-as-you-go pricing. Amazon Lex can power bots inside a contact center but is not a contact center itself, SNS sends notifications, and WorkSpaces provides virtual desktops.',
  },
  {
    id: 'tech-170',
    domain: 'technology-services',
    question:
      'A company wants its application to send transactional emails, such as order confirmations and password reset messages, using a scalable cloud email service. Which service should it use?',
    options: ['Amazon SQS', 'Amazon Connect', 'Amazon MQ', 'Amazon Simple Email Service (Amazon SES)'],
    answer: [3],
    explanation:
      '**Amazon SES** is a cloud email service for sending transactional, marketing, and bulk email from applications. SQS and Amazon MQ are messaging services between application components, and Amazon Connect is a contact center service.',
  },
];
