import type { ExamQuestion } from '../../types';

export const cloudConceptsQuestions: ExamQuestion[] = [
  {
    id: 'cc-001',
    domain: 'cloud-concepts',
    question:
      'A company wants to serve customers in several countries with low latency, without building or leasing data centers in those countries. Which benefit of the AWS Cloud does this describe?',
    options: [
      'Benefit from massive economies of scale',
      'Trade fixed expense for variable expense',
      'Go global in minutes',
      'Stop guessing capacity',
    ],
    answer: [2],
    explanation:
      '**Go global in minutes** means you can deploy workloads in AWS Regions around the world with a few clicks, putting applications close to end users. Economies of scale is about lower prices, trading fixed for variable expense is about paying only for what you use, and stop guessing capacity is about matching capacity to demand.',
  },
  {
    id: 'cc-002',
    domain: 'cloud-concepts',
    question:
      'A startup does not want to buy servers up front. Instead, it wants to pay only for the compute it actually consumes each month. Which benefit of the AWS Cloud does this describe?',
    options: [
      'Trade fixed expense for variable expense',
      'Increase speed and agility',
      'Go global in minutes',
      'Benefit from high availability',
    ],
    answer: [0],
    explanation:
      'Instead of investing heavily in data centers and servers before knowing how they will be used, you **trade fixed (upfront) expense for variable expense** and pay only when you consume resources. Speed and agility is about how fast resources can be provisioned, going global is about deploying in many Regions, and high availability is about resilience, not the spending model.',
  },
  {
    id: 'cc-003',
    domain: 'cloud-concepts',
    question:
      'Because AWS aggregates usage from a very large number of customers, it can achieve lower costs and offer lower pay-as-you-go prices. Which advantage of cloud computing is this?',
    options: [
      'Elasticity',
      'Agility',
      'Stop guessing capacity',
      'Benefit from massive economies of scale',
    ],
    answer: [3],
    explanation:
      'AWS describes this as **benefit from massive economies of scale**: aggregated usage across many customers lets AWS operate more efficiently and pass the savings on as lower prices. Elasticity is about scaling resources with demand, agility is about speed of provisioning and experimentation, and stop guessing capacity is about avoiding over- or under-provisioning.',
  },
  {
    id: 'cc-004',
    domain: 'cloud-concepts',
    question:
      'A retailer buys enough on-premises servers to handle its holiday peak, and most of them sit idle for the rest of the year. Which AWS Cloud benefit most directly addresses this problem?',
    options: [
      'Go global in minutes',
      'Stop guessing capacity',
      'Benefit from massive economies of scale',
      'Stop spending money on application development',
    ],
    answer: [1],
    explanation:
      'With **stop guessing capacity**, you can scale up for the peak and scale back down afterwards, instead of buying for the peak and leaving hardware idle. Going global is about geographic reach, economies of scale is about lower unit prices, and the cloud does not remove the need to spend on application development.',
  },
  {
    id: 'cc-005',
    domain: 'cloud-concepts',
    question: 'Which statement best describes elasticity in the AWS Cloud?',
    options: [
      'The ability to deploy an application in multiple AWS Regions',
      'The ability to acquire resources when you need them and release them when you no longer need them',
      'The ability of an application to keep running if one Availability Zone fails',
      'The ability to pay a lower price per unit as total usage grows',
    ],
    answer: [1],
    explanation:
      '**Elasticity** means automatically or quickly adding resources as demand rises and releasing them as demand falls, so you pay only for what you need. Multi-Region deployment is global reach, surviving an AZ failure is high availability, and lower unit prices with volume relate to economies of scale or tiered pricing.',
  },
  {
    id: 'cc-006',
    domain: 'cloud-concepts',
    question:
      'Developers at a company can now create new test environments in minutes instead of waiting weeks for hardware, so they try more ideas. Which benefit of the AWS Cloud does this describe?',
    options: [
      'Economies of scale',
      'High availability',
      'Increased speed and agility',
      'Fault tolerance',
    ],
    answer: [2],
    explanation:
      'In the cloud, new IT resources are only a click away, which reduces the time to make them available to developers from weeks to minutes. This is **increased speed and agility**. Economies of scale relates to price, while high availability and fault tolerance relate to keeping workloads running during failures.',
  },
  {
    id: 'cc-007',
    domain: 'cloud-concepts',
    question: 'Which of the following are advantages of cloud computing described by AWS? (Choose two.)',
    options: [
      'Trade fixed expense for variable expense',
      'Remove all customer responsibility for securing applications',
      'Guarantee zero downtime for every workload',
      'Stop spending money running and maintaining data centers',
      'Pay a fixed annual price regardless of usage',
    ],
    answer: [0, 3],
    explanation:
      '**Trade fixed expense for variable expense** and **stop spending money running and maintaining data centers** are two of the advantages of cloud computing that AWS lists. Under the shared responsibility model customers still secure their applications and data, AWS does not guarantee zero downtime for every workload, and pay-as-you-go pricing is the opposite of a fixed annual price.',
  },
  {
    id: 'cc-008',
    domain: 'cloud-concepts',
    question:
      'A company wants its web application to keep running if a single data center fails. What should the company do?',
    options: [
      'Use a larger instance type in one Availability Zone',
      'Store backups in the same Availability Zone as the application',
      'Enable detailed monitoring on the instances',
      'Deploy the application across multiple Availability Zones in a Region',
    ],
    answer: [3],
    explanation:
      'Availability Zones are physically separate, isolated locations in a Region, so running the application in **multiple AZs** keeps it available if one data center or AZ fails. A larger instance in one AZ is still a single point of failure, backups in the same AZ share its failure, and detailed monitoring only gives more frequent metrics.',
  },
  {
    id: 'cc-009',
    domain: 'cloud-concepts',
    question: 'Which of the following describes an AWS Availability Zone?',
    options: [
      'One or more discrete data centers with redundant power, networking, and connectivity in an AWS Region',
      'A geographic area that contains multiple AWS Regions',
      'A site that Amazon CloudFront uses to cache content close to users',
      'A rack of AWS-managed hardware installed in a customer data center',
    ],
    answer: [0],
    explanation:
      'An **Availability Zone** is one or more discrete data centers with redundant power, networking, and connectivity inside a Region. A Region contains multiple AZs (not the reverse), CloudFront caches content at edge locations, and AWS hardware in a customer data center is AWS Outposts.',
  },
  {
    id: 'cc-010',
    domain: 'cloud-concepts',
    question:
      'A company wants its IT staff to stop racking, stacking, and powering servers so they can focus on projects that serve its customers. Which benefit of the AWS Cloud does this describe?',
    options: [
      'Go global in minutes',
      'Benefit from massive economies of scale',
      'Stop spending money running and maintaining data centers',
      'Trade variable expense for fixed expense',
    ],
    answer: [2],
    explanation:
      '**Stop spending money running and maintaining data centers** lets teams focus on projects that differentiate the business instead of the heavy lifting of racking, stacking, and powering servers. Going global and economies of scale are different benefits, and the cloud trades fixed expense for variable expense, not the other way round.',
  },
  {
    id: 'cc-011',
    domain: 'cloud-concepts',
    question: 'Which of the following is one of the six pillars of the AWS Well-Architected Framework?',
    options: ['Scalability', 'Sustainability', 'Elasticity', 'Agility'],
    answer: [1],
    explanation:
      'The six pillars are operational excellence, security, reliability, performance efficiency, cost optimization, and **sustainability**. Scalability, elasticity, and agility are cloud characteristics or benefits, not pillars of the framework.',
  },
  {
    id: 'cc-012',
    domain: 'cloud-concepts',
    question: 'Which of the following are pillars of the AWS Well-Architected Framework? (Choose two.)',
    options: [
      'Availability',
      'Operational excellence',
      'Compliance',
      'Scalability',
      'Performance efficiency',
    ],
    answer: [1, 4],
    explanation:
      '**Operational excellence** and **performance efficiency** are two of the six pillars (with security, reliability, cost optimization, and sustainability). Availability is addressed within the reliability pillar, compliance within the security pillar, and scalability within reliability and performance efficiency, but none of them is a pillar itself.',
  },
  {
    id: 'cc-013',
    domain: 'cloud-concepts',
    question:
      'Which Well-Architected pillar focuses on a workload performing its intended function correctly and consistently, and on recovering quickly from failures?',
    options: ['Reliability', 'Performance efficiency', 'Operational excellence', 'Security'],
    answer: [0],
    explanation:
      'The **reliability** pillar covers the ability of a workload to perform its intended function correctly and consistently, including recovering from failure. Performance efficiency is about using resources efficiently, operational excellence is about running and improving operations, and security is about protecting data and systems.',
  },
  {
    id: 'cc-014',
    domain: 'cloud-concepts',
    question:
      'Which Well-Architected pillar focuses on using computing resources efficiently to meet requirements, and on maintaining that efficiency as demand changes and technologies evolve?',
    options: ['Reliability', 'Cost optimization', 'Sustainability', 'Performance efficiency'],
    answer: [3],
    explanation:
      'That is the definition of the **performance efficiency** pillar. Reliability is about functioning correctly and recovering from failure, cost optimization is about avoiding unnecessary cost, and sustainability is about minimizing environmental impact.',
  },
  {
    id: 'cc-015',
    domain: 'cloud-concepts',
    question:
      'Which pillar of the AWS Well-Architected Framework includes the design principle "make frequent, small, reversible changes"?',
    options: ['Security', 'Reliability', 'Operational excellence', 'Cost optimization'],
    answer: [2],
    explanation:
      '**Make frequent, small, reversible changes** is an operational excellence design principle: small changes are easier to deploy and roll back, and reduce the impact of failures. Security, reliability, and cost optimization each have their own design principles, such as applying security at all layers, automatically recovering from failure, and adopting a consumption model.',
  },
  {
    id: 'cc-016',
    domain: 'cloud-concepts',
    question:
      'Which pillar of the AWS Well-Architected Framework includes the design principle "implement a strong identity foundation"?',
    options: ['Operational excellence', 'Security', 'Reliability', 'Sustainability'],
    answer: [1],
    explanation:
      '**Implement a strong identity foundation** (least privilege, separation of duties, centralized identity management) is a **security** pillar design principle. The other pillars do not own identity and access management principles.',
  },
  {
    id: 'cc-017',
    domain: 'cloud-concepts',
    question:
      'The design principles "automatically recover from failure" and "test recovery procedures" belong to which Well-Architected pillar?',
    options: ['Reliability', 'Performance efficiency', 'Security', 'Cost optimization'],
    answer: [0],
    explanation:
      'Both are **reliability** pillar design principles, along with scaling horizontally, stopping guessing capacity, and managing change through automation. Performance efficiency, security, and cost optimization focus on efficient resource use, protection, and cost respectively.',
  },
  {
    id: 'cc-018',
    domain: 'cloud-concepts',
    question:
      'The design principles "democratize advanced technologies" and "use serverless architectures" belong to which Well-Architected pillar?',
    options: ['Operational excellence', 'Reliability', 'Cost optimization', 'Performance efficiency'],
    answer: [3],
    explanation:
      'These are **performance efficiency** design principles, together with going global in minutes, experimenting more often, and considering mechanical sympathy. They are not listed under operational excellence, reliability, or cost optimization.',
  },
  {
    id: 'cc-019',
    domain: 'cloud-concepts',
    question:
      'The design principles "implement cloud financial management" and "adopt a consumption model" belong to which Well-Architected pillar?',
    options: ['Performance efficiency', 'Operational excellence', 'Cost optimization', 'Sustainability'],
    answer: [2],
    explanation:
      'Both are **cost optimization** design principles: build cloud financial management capability, and pay only for the resources you consume. Performance efficiency, operational excellence, and sustainability have different design principles.',
  },
  {
    id: 'cc-020',
    domain: 'cloud-concepts',
    question: 'What is the focus of the sustainability pillar of the AWS Well-Architected Framework?',
    options: [
      'Reducing the monthly bill for running workloads',
      'Minimizing the environmental impacts of running cloud workloads',
      'Ensuring workloads recover quickly from disruptions',
      'Running and monitoring systems to deliver business value',
    ],
    answer: [1],
    explanation:
      'The **sustainability** pillar focuses on minimizing the environmental impacts of running cloud workloads, for example by maximizing utilization and reducing the resources required. Reducing the bill is cost optimization, recovering from disruptions is reliability, and running and monitoring systems is operational excellence.',
  },
  {
    id: 'cc-021',
    domain: 'cloud-concepts',
    question:
      'A company wants to review its workloads against AWS architectural best practices, identify high-risk issues, and track an improvement plan, at no additional charge. Which AWS service should it use?',
    options: ['AWS Well-Architected Tool', 'AWS Artifact', 'Amazon Inspector', 'AWS Pricing Calculator'],
    answer: [0],
    explanation:
      'The **AWS Well-Architected Tool** is available in the console at no charge and reviews workloads against the Well-Architected Framework, highlighting risks and improvement plans. AWS Artifact provides compliance reports, Amazon Inspector scans for software vulnerabilities, and the Pricing Calculator estimates costs.',
  },
  {
    id: 'cc-022',
    domain: 'cloud-concepts',
    question:
      'Under the shared responsibility model for sustainability in the AWS Well-Architected Framework, which of the following is the customer responsible for?',
    options: [
      'The energy efficiency of cooling in AWS data centers',
      'Procuring renewable energy for AWS facilities',
      'Designing the server hardware that AWS deploys',
      'Optimizing workloads and resource utilization to minimize the resources required',
    ],
    answer: [3],
    explanation:
      'AWS is responsible for sustainability **of** the cloud (efficient data centers, hardware, and energy procurement), and customers are responsible for sustainability **in** the cloud, meaning how they design and use their workloads. Data center cooling, renewable energy procurement, and server hardware design are AWS responsibilities.',
  },
  {
    id: 'cc-023',
    domain: 'cloud-concepts',
    question:
      'Which of the following are design principles of the security pillar of the AWS Well-Architected Framework? (Choose two.)',
    options: [
      'Apply security at all layers',
      'Make frequent, small, reversible changes',
      'Maintain traceability',
      'Scale horizontally to increase aggregate workload availability',
      'Experiment more often',
    ],
    answer: [0, 2],
    explanation:
      '**Apply security at all layers** and **maintain traceability** (monitor, alert, and audit actions and changes in real time) are security design principles. Frequent small reversible changes is operational excellence, scaling horizontally is reliability, and experimenting more often is performance efficiency.',
  },
  {
    id: 'cc-024',
    domain: 'cloud-concepts',
    question:
      'Which of the following are design principles of the reliability pillar of the AWS Well-Architected Framework? (Choose two.)',
    options: [
      'Go global in minutes',
      'Stop guessing capacity',
      'Keep people away from data',
      'Manage change through automation',
      'Analyze and attribute expenditure',
    ],
    answer: [1, 3],
    explanation:
      '**Stop guessing capacity** and **manage change through automation** are reliability design principles. Going global in minutes is performance efficiency, keeping people away from data is security, and analyzing and attributing expenditure is cost optimization.',
  },
  {
    id: 'cc-025',
    domain: 'cloud-concepts',
    question:
      'An operations team notices that its runbooks are out of date and no longer match how the workload has evolved. Which Well-Architected design principle recommends regularly reviewing and improving them?',
    options: [
      'Use serverless architectures',
      'Keep people away from data',
      'Refine operations procedures frequently',
      'Adopt a consumption model',
    ],
    answer: [2],
    explanation:
      '**Refine operations procedures frequently** is an operational excellence principle: as the workload evolves, procedures should be updated and validated, for example through regular reviews and game days. Serverless architectures is performance efficiency, keeping people away from data is security, and adopting a consumption model is cost optimization.',
  },
  {
    id: 'cc-026',
    domain: 'cloud-concepts',
    question:
      'A company wants to reduce the risk of mishandling or modifying sensitive data by using tools and automation instead of giving staff direct manual access to it. Which security design principle does this follow?',
    options: [
      'Keep people away from data',
      'Apply security at all layers',
      'Prepare for security events',
      'Implement a strong identity foundation',
    ],
    answer: [0],
    explanation:
      '**Keep people away from data** means using mechanisms and tools to reduce or eliminate direct access to and manual processing of data. Applying security at all layers is defense in depth, preparing for security events is about incident response, and a strong identity foundation is about least privilege and centralized identity.',
  },
  {
    id: 'cc-027',
    domain: 'cloud-concepts',
    question:
      'A company moves a self-managed database from Amazon EC2 to Amazon RDS so that AWS handles tasks such as backups and patching, and its engineers can focus on product features. Which cost optimization design principle does this follow?',
    options: [
      'Measure overall efficiency',
      'Stop spending money on undifferentiated heavy lifting',
      'Analyze and attribute expenditure',
      'Implement cloud financial management',
    ],
    answer: [1],
    explanation:
      '**Stop spending money on undifferentiated heavy lifting** encourages letting AWS do work that does not differentiate your business, such as managing database infrastructure, so you can focus on customers. Measuring efficiency, attributing expenditure, and cloud financial management are other cost principles that do not describe this choice.',
  },
  {
    id: 'cc-028',
    domain: 'cloud-concepts',
    question:
      'A company wants to accurately identify which business units and products are driving its cloud costs so that owners can be held accountable. Which cost optimization design principle does this follow?',
    options: [
      'Adopt a consumption model',
      'Measure overall efficiency',
      'Implement a strong identity foundation',
      'Analyze and attribute expenditure',
    ],
    answer: [3],
    explanation:
      '**Analyze and attribute expenditure** is about identifying the cost and usage of workloads and attributing IT costs to revenue streams and owners, often using cost allocation tags. Adopting a consumption model is about paying only for what you use, measuring efficiency is about business output per cost, and a strong identity foundation is a security principle.',
  },
  {
    id: 'cc-029',
    domain: 'cloud-concepts',
    question:
      'Because resources in AWS are virtual and can be automated, a team quickly runs comparative tests with different instance types, storage options, and configurations. Which performance efficiency design principle is this?',
    options: [
      'Consider mechanical sympathy',
      'Democratize advanced technologies',
      'Experiment more often',
      'Use serverless architectures',
    ],
    answer: [2],
    explanation:
      '**Experiment more often** reflects that virtual, automatable resources make comparative testing quick and cheap. Mechanical sympathy is about choosing technology that fits how it will be used, democratizing advanced technologies is about consuming complex technology as a service, and serverless removes the need to manage servers.',
  },
  {
    id: 'cc-030',
    domain: 'cloud-concepts',
    question:
      'A team chooses its database and storage approach based on the data access patterns of the workload, using the technology that best aligns with its goals. Which performance efficiency design principle is this?',
    options: [
      'Consider mechanical sympathy',
      'Experiment more often',
      'Go global in minutes',
      'Measure overall efficiency',
    ],
    answer: [0],
    explanation:
      '**Consider mechanical sympathy** means using the technology approach that aligns best with your goals, for example considering data access patterns when selecting database or storage. Experimenting more often and going global in minutes are other performance efficiency principles, and measuring overall efficiency is a cost optimization principle.',
  },
  {
    id: 'cc-031',
    domain: 'cloud-concepts',
    question:
      'The AWS Well-Architected Framework notes that two hosts running at 30% utilization are less efficient than one host running at 60%. Which sustainability design principle does this illustrate?',
    options: [
      'Use managed services',
      'Maximize utilization',
      'Anticipate and adopt new, more efficient hardware and software offerings',
      'Understand your impact',
    ],
    answer: [1],
    explanation:
      '**Maximize utilization** means right-sizing and consolidating workloads so resources run at high utilization, because idle capacity still consumes energy. Managed services, adopting more efficient offerings, and understanding your impact are other sustainability principles that this example does not describe.',
  },
  {
    id: 'cc-032',
    domain: 'cloud-concepts',
    question:
      'A company plans to regularly move its workloads to newer instance generations that deliver more performance for the same energy. Which sustainability design principle does this follow?',
    options: [
      'Maximize utilization',
      'Reduce the downstream impact of your cloud workloads',
      'Establish sustainability goals',
      'Anticipate and adopt new, more efficient hardware and software offerings',
    ],
    answer: [3],
    explanation:
      '**Anticipate and adopt new, more efficient hardware and software offerings** encourages designing for flexibility so you can quickly adopt more efficient technologies. Maximizing utilization is about consolidating idle capacity, reducing downstream impact is about the energy and resources your customers need to use your service, and establishing goals is about setting targets.',
  },
  {
    id: 'cc-033',
    domain: 'cloud-concepts',
    question:
      'A company regularly schedules simulated events in production to test how its architecture and operational processes perform. Which general design principle of the AWS Well-Architected Framework is this?',
    options: [
      'Test systems at production scale',
      'Drive architectures using data',
      'Improve through game days',
      'Consider evolutionary architectures',
    ],
    answer: [2],
    explanation:
      '**Improve through game days** means regularly simulating events in production to test architecture and processes and find areas to improve. Testing at production scale is about creating a production-scale test environment on demand, driving architectures using data is about fact-based decisions, and evolutionary architectures is about allowing designs to change over time.',
  },
  {
    id: 'cc-034',
    domain: 'cloud-concepts',
    question:
      'A security team runs incident response simulations and puts tools in place to speed up detection, investigation, and recovery. Which security design principle does this follow?',
    options: [
      'Prepare for security events',
      'Maintain traceability',
      'Apply security at all layers',
      'Protect data in transit and at rest',
    ],
    answer: [0],
    explanation:
      '**Prepare for security events** means having incident management processes, running simulations, and using tools and automation to speed up detection, investigation, and recovery. Traceability is about logging and auditing, applying security at all layers is defense in depth, and protecting data is about encryption and access controls.',
  },
  {
    id: 'cc-035',
    domain: 'cloud-concepts',
    question:
      'Which of the following are design principles of the operational excellence pillar of the AWS Well-Architected Framework? (Choose two.)',
    options: [
      'Refine operations procedures frequently',
      'Democratize advanced technologies',
      'Protect data in transit and at rest',
      'Anticipate failure',
      'Adopt a consumption model',
    ],
    answer: [0, 3],
    explanation:
      '**Refine operations procedures frequently** and **anticipate failure** are operational excellence design principles. Democratizing advanced technologies is performance efficiency, protecting data in transit and at rest is security, and adopting a consumption model is cost optimization.',
  },
  {
    id: 'cc-036',
    domain: 'cloud-concepts',
    question:
      'A company wants its architecture to deliver business value at the lowest price point, for example by selecting the right resource types and pricing models and avoiding unnecessary spending. Which Well-Architected pillar is this?',
    options: ['Sustainability', 'Performance efficiency', 'Reliability', 'Cost optimization'],
    answer: [3],
    explanation:
      'The **cost optimization** pillar is about running systems to deliver business value at the lowest price point and avoiding unnecessary costs. Sustainability focuses on environmental impact, performance efficiency on efficient use of resources to meet requirements, and reliability on correct, consistent operation and recovery.',
  },
  {
    id: 'cc-037',
    domain: 'cloud-concepts',
    question:
      'Which of the following actions align most closely with the reliability pillar of the AWS Well-Architected Framework? (Choose two.)',
    options: [
      'Tagging resources by cost center',
      'Encrypting data at rest',
      'Using automatic scaling to add capacity when demand increases',
      'Restricting accounts with service control policies',
      'Deploying the workload across multiple Availability Zones',
    ],
    answer: [2, 4],
    explanation:
      'Reliability includes **stopping guessing capacity** by scaling automatically with demand, and removing single points of failure by **deploying across multiple Availability Zones**. Tagging by cost center supports cost optimization, while encryption at rest and service control policies are security controls.',
  },
  {
    id: 'cc-038',
    domain: 'cloud-concepts',
    question:
      'Which perspective of the AWS Cloud Adoption Framework (AWS CAF) helps ensure that cloud investments accelerate digital transformation ambitions and business outcomes?',
    options: ['Governance', 'Platform', 'Business', 'People'],
    answer: [2],
    explanation:
      'The **Business** perspective focuses on making sure cloud investments accelerate digital transformation and business outcomes, with capabilities such as strategy management and portfolio management. Governance focuses on orchestrating initiatives and managing risk, Platform on the technical cloud platform, and People on culture and skills.',
  },
  {
    id: 'cc-039',
    domain: 'cloud-concepts',
    question:
      'Which AWS CAF perspective serves as a bridge between technology and business, focusing on culture, organizational structure, leadership, and the workforce?',
    options: ['People', 'Business', 'Operations', 'Governance'],
    answer: [0],
    explanation:
      'The **People** perspective bridges technology and business and covers capabilities such as culture evolution, transformational leadership, cloud fluency, and organization design. Business focuses on business outcomes, Operations on delivering cloud services that meet business needs, and Governance on orchestrating initiatives while managing risk.',
  },
  {
    id: 'cc-040',
    domain: 'cloud-concepts',
    question:
      'Which AWS CAF perspective helps orchestrate cloud initiatives while maximizing organizational benefits and minimizing transformation-related risks?',
    options: ['Business', 'Governance', 'Security', 'Operations'],
    answer: [1],
    explanation:
      'The **Governance** perspective includes capabilities such as program and project management, benefits management, risk management, and cloud financial management. Business focuses on outcomes and strategy, Security on confidentiality, integrity, and availability, and Operations on running cloud services.',
  },
  {
    id: 'cc-041',
    domain: 'cloud-concepts',
    question:
      'A company wants to build an enterprise-grade, scalable hybrid cloud environment, modernize existing workloads, and set up CI/CD pipelines. Which AWS CAF perspective covers these capabilities?',
    options: ['Operations', 'Security', 'Governance', 'Platform'],
    answer: [3],
    explanation:
      'The **Platform** perspective helps build an enterprise-grade, scalable, hybrid cloud platform and includes capabilities such as platform architecture, modern application development, and CI/CD. Operations focuses on running services, Security on protecting data and workloads, and Governance on managing initiatives and risk.',
  },
  {
    id: 'cc-042',
    domain: 'cloud-concepts',
    question:
      'Which AWS CAF perspective focuses on ensuring that cloud services are delivered at a level that meets business needs, with capabilities such as observability, event management, and incident and problem management?',
    options: ['Platform', 'Governance', 'Operations', 'Security'],
    answer: [2],
    explanation:
      'The **Operations** perspective ensures cloud services are delivered at an agreed level and includes observability, event management, incident and problem management, and change and release management. Platform focuses on building the cloud platform, Governance on risk and benefits, and Security on protecting workloads.',
  },
  {
    id: 'cc-043',
    domain: 'cloud-concepts',
    question:
      'Which AWS CAF perspective includes capabilities such as identity and access management, threat detection, and vulnerability management?',
    options: ['Security', 'Operations', 'Governance', 'Platform'],
    answer: [0],
    explanation:
      'The **Security** perspective helps achieve the confidentiality, integrity, and availability of data and cloud workloads, with capabilities such as identity and access management, threat detection, vulnerability management, and incident response. Operations, Governance, and Platform cover service delivery, risk and benefits, and platform engineering.',
  },
  {
    id: 'cc-044',
    domain: 'cloud-concepts',
    question: 'Which AWS CAF perspectives focus on technical capabilities? (Choose two.)',
    options: ['Platform', 'Business', 'People', 'Operations', 'Governance'],
    answer: [0, 3],
    explanation:
      'The AWS CAF groups its perspectives into business capabilities (**Business, People, Governance**) and technical capabilities (**Platform, Security, Operations**). Of the options, only Platform and Operations are technical perspectives.',
  },
  {
    id: 'cc-045',
    domain: 'cloud-concepts',
    question: 'In the AWS Cloud Adoption Framework, cloud financial management is a capability of which perspective?',
    options: ['Business', 'Governance', 'Operations', 'Platform'],
    answer: [1],
    explanation:
      '**Cloud financial management** is a capability of the **Governance** perspective, alongside program and project management, benefits management, and risk management. Business covers strategy and portfolio, Operations covers running services, and Platform covers the technical cloud platform.',
  },
  {
    id: 'cc-046',
    domain: 'cloud-concepts',
    question:
      'During its cloud migration, a company finds that many employees lack cloud skills and that teams resist new ways of working. Which AWS CAF perspective addresses these challenges?',
    options: ['Business', 'Governance', 'Platform', 'People'],
    answer: [3],
    explanation:
      'The **People** perspective covers capabilities such as cloud fluency, workforce transformation, change acceleration, and culture evolution, which address skills gaps and resistance to change. Business, Governance, and Platform address business outcomes, risk and benefits, and technical platform capabilities.',
  },
  {
    id: 'cc-047',
    domain: 'cloud-concepts',
    question:
      'In the AWS CAF cloud transformation journey, which phase focuses on delivering pilot initiatives in production and demonstrating incremental business value?',
    options: ['Envision', 'Align', 'Launch', 'Scale'],
    answer: [2],
    explanation:
      'The four phases are Envision, Align, Launch, and Scale. **Launch** delivers pilot initiatives in production and demonstrates incremental business value. Envision shows how the cloud will accelerate outcomes, Align identifies capability gaps and dependencies, and Scale expands pilots to the desired scale.',
  },
  {
    id: 'cc-048',
    domain: 'cloud-concepts',
    question:
      'Which of the following are business outcomes that the AWS Cloud Adoption Framework identifies as results of cloud transformation? (Choose two.)',
    options: [
      'Increased capital expenditure',
      'Reduced business risk',
      'Increased operational efficiency',
      'Elimination of all compliance obligations',
      'Longer hardware refresh cycles',
    ],
    answer: [1, 2],
    explanation:
      'AWS CAF lists **reduced business risk**, improved environmental, social, and governance (ESG) performance, increased revenue, and **increased operational efficiency** as business outcomes. The cloud reduces rather than increases capital expenditure, compliance obligations remain, and hardware refresh cycles are no longer a customer concern.',
  },
  {
    id: 'cc-049',
    domain: 'cloud-concepts',
    question:
      'A company wants to lift and shift a large number of on-premises servers to Amazon EC2 without changing the applications. Which AWS service is primarily designed for this?',
    options: [
      'AWS Database Migration Service (AWS DMS)',
      'AWS Application Migration Service',
      'AWS DataSync',
      'AWS Snow Family',
    ],
    answer: [1],
    explanation:
      '**AWS Application Migration Service** is the primary AWS service for rehosting (lift and shift) servers to AWS. AWS DMS migrates databases, AWS DataSync transfers files and objects online, and the Snow Family moves data offline on physical devices; none of them rehosts whole servers.',
  },
  {
    id: 'cc-050',
    domain: 'cloud-concepts',
    question:
      'A company migrates its self-managed MySQL database to Amazon RDS for MySQL to reduce management effort, without changing the core architecture of the application. Which migration strategy is this?',
    options: ['Replatform', 'Rehost', 'Relocate', 'Retain'],
    answer: [0],
    explanation:
      '**Replatform** ("lift, tinker, and shift") makes a few cloud optimizations, such as moving to a managed database, without changing the core architecture. Rehost moves the application as is, relocate moves servers at the hypervisor level to a cloud version of the same platform, and retain keeps the application on premises.',
  },
  {
    id: 'cc-051',
    domain: 'cloud-concepts',
    question:
      'A company replaces its on-premises customer relationship management (CRM) software with a software as a service (SaaS) CRM product. Which migration strategy is this?',
    options: ['Rehost', 'Refactor', 'Retire', 'Repurchase'],
    answer: [3],
    explanation:
      '**Repurchase** ("drop and shop") means moving to a different product, typically a SaaS offering. Rehost moves the existing application unchanged, refactor re-architects it, and retire decommissions an application that is no longer needed.',
  },
  {
    id: 'cc-052',
    domain: 'cloud-concepts',
    question:
      'A company re-architects a monolithic application into microservices that use serverless and other cloud-native features to improve agility and scalability. Which migration strategy is this?',
    options: ['Replatform', 'Relocate', 'Refactor', 'Rehost'],
    answer: [2],
    explanation:
      '**Refactor** (re-architect) changes how the application is architected and developed, usually to adopt cloud-native features. Replatform makes only a few optimizations, while relocate and rehost move workloads without changing the application.',
  },
  {
    id: 'cc-053',
    domain: 'cloud-concepts',
    question:
      'During a migration assessment, a company finds an application that is no longer used and decides to decommission it. Which migration strategy is this?',
    options: ['Retain', 'Retire', 'Repurchase', 'Relocate'],
    answer: [1],
    explanation:
      '**Retire** means decommissioning or archiving applications that are no longer needed, which reduces the migration scope and cost. Retain keeps an application where it is for now, repurchase moves to a different product, and relocate moves servers to a cloud version of the same platform.',
  },
  {
    id: 'cc-054',
    domain: 'cloud-concepts',
    question:
      'A company decides to keep an application on premises for now because it was recently upgraded and has strict dependencies, and to revisit it later. Which migration strategy is this?',
    options: ['Retain', 'Retire', 'Rehost', 'Relocate'],
    answer: [0],
    explanation:
      '**Retain** (revisit) keeps applications in the source environment, for example because of recent upgrades, dependencies, or compliance needs. Retire decommissions the application, and rehost and relocate move it to AWS.',
  },
  {
    id: 'cc-055',
    domain: 'cloud-concepts',
    question:
      'A company wants to move a large number of virtual machines from its on-premises virtualization platform to a cloud-based version of the same platform, without buying new hardware or modifying the applications. Which migration strategy is this?',
    options: ['Rehost', 'Replatform', 'Repurchase', 'Relocate'],
    answer: [3],
    explanation:
      '**Relocate** (hypervisor-level lift and shift) transfers many servers from an on-premises platform to a cloud version of the same platform, such as moving VMware workloads to a VMware-based cloud offering. Rehost moves servers onto Amazon EC2, replatform adds optimizations, and repurchase switches to a different product.',
  },
  {
    id: 'cc-056',
    domain: 'cloud-concepts',
    question:
      'Which of the 7 Rs migration strategies result in an application NOT being moved to AWS? (Choose two.)',
    options: ['Rehost', 'Relocate', 'Retire', 'Replatform', 'Retain'],
    answer: [2, 4],
    explanation:
      '**Retire** decommissions the application and **retain** keeps it in the source environment, so neither moves it to AWS. Rehost, relocate, and replatform all move the application to AWS, with different levels of change.',
  },
  {
    id: 'cc-057',
    domain: 'cloud-concepts',
    question:
      'Which migration strategy usually requires the most time and effort up front, but best positions an application to take advantage of cloud-native features?',
    options: ['Rehost', 'Relocate', 'Refactor', 'Retain'],
    answer: [2],
    explanation:
      '**Refactor** re-architects the application, which is the most effort but unlocks cloud-native benefits such as serverless, microservices, and better scalability. Rehost and relocate are fast because the application is not changed, and retain does not migrate the application at all.',
  },
  {
    id: 'cc-058',
    domain: 'cloud-concepts',
    question:
      'A company must exit its data center within a few months because the lease is ending. It wants to move hundreds of applications as quickly as possible with minimal changes. Which migration strategy is most appropriate?',
    options: ['Rehost', 'Refactor', 'Repurchase', 'Retain'],
    answer: [0],
    explanation:
      '**Rehost** (lift and shift) moves applications without changes, which makes it the fastest way to migrate at scale under a deadline; they can be optimized after the move. Refactoring takes much longer, repurchasing means selecting and adopting new products, and retain keeps applications in the data center that is closing.',
  },
  {
    id: 'cc-059',
    domain: 'cloud-concepts',
    question:
      'A company needs to move hundreds of terabytes of data to AWS, but its internet connection is limited and an online transfer would take months. Which option is most suitable?',
    options: [
      'Amazon S3 Transfer Acceleration',
      'AWS Site-to-Site VPN',
      'AWS Database Migration Service (AWS DMS)',
      'An AWS Snow Family device',
    ],
    answer: [3],
    explanation:
      'The **AWS Snow Family** provides physical devices that are shipped to the customer, loaded with data, and returned to AWS, which avoids slow or limited networks for very large transfers. S3 Transfer Acceleration and Site-to-Site VPN still depend on the limited internet connection, and AWS DMS migrates databases over the network. Note: AWS Snowball Edge has been closed to new customers since November 2025; AWS now points new customers to AWS DataSync for online transfers or AWS Data Transfer Terminal for physical transfers. The exam guide still lists the Snow Family, so know what it is for.',
  },
  {
    id: 'cc-060',
    domain: 'cloud-concepts',
    question:
      'A research vessel at sea needs to collect and process data with no network connectivity, then transfer the data to AWS when it returns to port. Which AWS offering fits this need?',
    options: ['AWS Outposts', 'AWS Local Zones', 'AWS Snow Family', 'Amazon CloudFront'],
    answer: [2],
    explanation:
      '**AWS Snow Family** devices provide storage and compute for edge locations with little or no connectivity, and the data can be shipped to AWS later. AWS Outposts needs a connection to its AWS Region, Local Zones are AWS-operated locations in metro areas, and CloudFront is a content delivery network. Note: AWS Snowball Edge has been closed to new customers since November 2025; AWS now points new customers to AWS DataSync for online transfers or AWS Data Transfer Terminal for physical transfers. The exam guide still lists the Snow Family, so know what it is for.',
  },
  {
    id: 'cc-061',
    domain: 'cloud-concepts',
    question:
      'A company wants to migrate an on-premises MySQL database to Amazon Aurora while the source database stays fully operational, minimizing downtime for applications. Which AWS service should it use?',
    options: [
      'AWS DataSync',
      'AWS Database Migration Service (AWS DMS)',
      'AWS Snow Family',
      'AWS Backup',
    ],
    answer: [1],
    explanation:
      '**AWS DMS** migrates databases to AWS while the source database remains fully operational, which minimizes downtime, and it can keep the target in sync through ongoing replication. DataSync transfers files and objects, the Snow Family moves data offline, and AWS Backup centralizes backups rather than migrating databases.',
  },
  {
    id: 'cc-062',
    domain: 'cloud-concepts',
    question: 'Which statement about AWS Database Migration Service (AWS DMS) is correct?',
    options: [
      'It supports homogeneous migrations and heterogeneous migrations between different database engines',
      'It can migrate databases only between identical database engines',
      'It requires the source database to be shut down for the whole migration',
      'It transfers petabytes of files by shipping physical storage devices',
    ],
    answer: [0],
    explanation:
      'AWS DMS supports both **homogeneous** migrations (for example, MySQL to MySQL) and **heterogeneous** migrations (for example, Oracle to Amazon Aurora PostgreSQL), with schema conversion tools for the latter. The source stays operational during migration, and shipping physical devices describes the Snow Family.',
  },
  {
    id: 'cc-063',
    domain: 'cloud-concepts',
    question: 'Which of the following are benefits of migrating workloads to the AWS Cloud? (Choose two.)',
    options: [
      'Reduced time to provision new infrastructure',
      'AWS manages all IAM permissions for the customer',
      'Guaranteed lower cost for every workload regardless of design',
      'Applications are automatically refactored during migration',
      'Ability to scale resources up and down to match demand',
    ],
    answer: [0, 4],
    explanation:
      'Migrating to AWS lets companies **provision infrastructure in minutes** and **scale resources with demand**. Customers remain responsible for managing IAM permissions, costs depend on how workloads are designed and operated, and migration does not refactor applications automatically.',
  },
  {
    id: 'cc-064',
    domain: 'cloud-concepts',
    question:
      'Which statement best describes how the spending model typically changes when a company moves from on-premises data centers to AWS?',
    options: [
      'It shifts from variable expense to fixed expense',
      'It shifts from operational expenditure to capital expenditure',
      'It shifts from pay-as-you-go pricing to large upfront payments',
      'It shifts from capital expenditure to operational expenditure',
    ],
    answer: [3],
    explanation:
      'On premises, companies make large upfront **capital expenditure (CapEx)** on hardware and facilities; in AWS, they mostly pay as they go, which is **operational expenditure (OpEx)**. The other options describe the reverse of what happens.',
  },
  {
    id: 'cc-065',
    domain: 'cloud-concepts',
    question:
      'Which of the following on-premises costs are often overlooked when comparing the total cost of ownership (TCO) of on-premises infrastructure with AWS? (Choose two.)',
    options: [
      'Hourly Amazon EC2 On-Demand charges',
      'Power and cooling for the data center',
      'AWS Support plan fees',
      'Staff time to maintain and replace hardware',
      'Per-request AWS Lambda charges',
    ],
    answer: [1, 3],
    explanation:
      'A fair TCO comparison includes indirect on-premises costs such as **power and cooling** and **staff time for hardware maintenance**, not just server purchase prices. EC2 On-Demand charges, AWS Support fees, and Lambda request charges are AWS costs, not on-premises costs.',
  },
  {
    id: 'cc-066',
    domain: 'cloud-concepts',
    question:
      'A company already owns licenses for a commercial database and wants to use them on AWS instead of paying for licenses as part of the AWS price. Which licensing model is this?',
    options: [
      'Bring your own license (BYOL)',
      'License included',
      'Savings Plans',
      'Spot Instances',
    ],
    answer: [0],
    explanation:
      'With **bring your own license (BYOL)**, a customer uses licenses it already owns on AWS, subject to the vendor license terms. License included means the license cost is part of the AWS price, while Savings Plans and Spot Instances are compute pricing options, not licensing models.',
  },
  {
    id: 'cc-067',
    domain: 'cloud-concepts',
    question:
      'A company does not own any Microsoft Windows Server licenses and wants the license cost bundled into the hourly price of its Amazon EC2 instances. Which option should it choose?',
    options: [
      'Bring your own license (BYOL)',
      'License-included instances',
      'Dedicated Hosts with BYOL',
      'Purchase perpetual licenses before migrating',
    ],
    answer: [1],
    explanation:
      'With **license-included** instances, the software license cost is part of the instance price, so the company does not need to buy or track licenses. BYOL options, including Dedicated Hosts with BYOL, require licenses the company already owns, and buying perpetual licenses up front is the opposite of what the company wants.',
  },
  {
    id: 'cc-068',
    domain: 'cloud-concepts',
    question:
      'A company wants to use existing server-bound software licenses that are licensed per physical socket or core. Which Amazon EC2 option gives the company visibility into the sockets and cores of the physical server?',
    options: [
      'Spot Instances',
      'On-Demand Instances on shared tenancy',
      'Savings Plans',
      'Amazon EC2 Dedicated Hosts',
    ],
    answer: [3],
    explanation:
      '**Dedicated Hosts** are physical servers dedicated to one customer and provide visibility into sockets and physical cores, which supports BYOL for server-bound licenses. Spot and On-Demand Instances on shared tenancy do not expose the physical server, and Savings Plans is a pricing commitment rather than a placement option.',
  },
  {
    id: 'cc-069',
    domain: 'cloud-concepts',
    question: 'What does rightsizing mean in the context of AWS cost optimization?',
    options: [
      'Moving workloads to the Region closest to users',
      'Buying Reserved Instances for every workload',
      'Matching instance types and sizes to workload performance and capacity needs at the lowest possible cost',
      'Deleting all snapshots older than a fixed age',
    ],
    answer: [2],
    explanation:
      '**Rightsizing** is matching instance types and sizes to the actual performance and capacity requirements of a workload at the lowest cost, often by downsizing or switching underused resources. Choosing a Region close to users is about latency, buying Reserved Instances is a pricing decision, and deleting old snapshots is a separate cleanup task.',
  },
  {
    id: 'cc-070',
    domain: 'cloud-concepts',
    question:
      'Which AWS service analyzes utilization metrics and recommends optimal AWS compute resources to reduce costs and improve performance?',
    options: ['AWS Compute Optimizer', 'AWS Artifact', 'Amazon Inspector', 'AWS Config'],
    answer: [0],
    explanation:
      '**AWS Compute Optimizer** uses utilization metrics to make rightsizing recommendations for resources such as EC2 instances, Auto Scaling groups, EBS volumes, and Lambda functions. AWS Artifact provides compliance reports, Amazon Inspector finds vulnerabilities, and AWS Config tracks resource configurations.',
  },
  {
    id: 'cc-071',
    domain: 'cloud-concepts',
    question:
      'A company moves from a self-managed database on Amazon EC2 to Amazon RDS. Which tasks does AWS take over as part of the managed service? (Choose two.)',
    options: [
      'Designing the database schema and indexes',
      'Provisioning and maintaining the underlying hardware',
      'Deciding which users can access the data',
      'Running automated backups of the database',
      'Writing efficient application queries',
    ],
    answer: [1, 3],
    explanation:
      'Amazon RDS reduces operational overhead by handling tasks such as **hardware provisioning** and **automated backups**, along with database setup and patching. The customer still designs schemas and indexes, controls who can access the data, and writes efficient queries.',
  },
  {
    id: 'cc-072',
    domain: 'cloud-concepts',
    question:
      'How can using infrastructure as code, such as AWS CloudFormation, help a company reduce costs?',
    options: [
      'It removes the charges for the resources it provisions',
      'It automatically purchases Reserved Instances',
      'It removes the need to monitor workloads',
      'It reduces manual effort and errors by creating repeatable environments that can be deleted when not needed',
    ],
    answer: [3],
    explanation:
      '**Automation** with infrastructure as code reduces manual work and configuration errors, and makes it easy to create environments on demand and delete them when they are no longer needed. You still pay for the resources CloudFormation creates, it does not buy Reserved Instances, and monitoring is still required.',
  },
  {
    id: 'cc-073',
    domain: 'cloud-concepts',
    question:
      'Which costs does a company typically eliminate or greatly reduce when it moves workloads from its own data center to AWS? (Choose two.)',
    options: [
      'Licensing for all third-party software',
      'Data center real estate and power',
      'Designing the application architecture',
      'Hardware refresh cycles',
      'Staff who develop the business applications',
    ],
    answer: [1, 3],
    explanation:
      'AWS takes on the costs of **data center facilities and power** and **hardware refreshes**, which become part of the pay-as-you-go price. Third-party software may still need licenses, application architecture still needs designing, and companies still need developers for their business applications.',
  },
  {
    id: 'cc-074',
    domain: 'cloud-concepts',
    question: 'Which of the following are examples of variable costs in the AWS Cloud? (Choose two.)',
    options: [
      'Buying servers for a new data center',
      'Paying for Amazon EC2 On-Demand Instances only while they run',
      'Paying for Amazon S3 storage based on the amount of data stored',
      'Constructing a data center building',
      'Signing a multi-year colocation lease',
    ],
    answer: [1, 2],
    explanation:
      '**EC2 On-Demand** charges and **S3 storage** charges vary with how much you use, which makes them variable costs. Buying servers, building a data center, and signing a multi-year colocation lease are fixed, upfront commitments typical of on-premises infrastructure.',
  },
  {
    id: 'cc-075',
    domain: 'cloud-concepts',
    question:
      'A company is launching a new application and has no idea how much demand it will get. Which pricing approach best avoids committing to capacity before demand is known?',
    options: [
      'On-Demand, pay-as-you-go pricing',
      'Three-year All Upfront Reserved Instances',
      'Buying on-premises servers sized for the expected peak',
      'Dedicated Hosts with a three-year reservation',
    ],
    answer: [0],
    explanation:
      '**On-Demand** pay-as-you-go pricing needs no long-term commitment, so the company pays only for what it uses while it learns its demand. Three-year Reserved Instances and reserved Dedicated Hosts are long-term commitments, and buying servers for the peak is guessing capacity.',
  },
  {
    id: 'cc-076',
    domain: 'cloud-concepts',
    question:
      'A company wants to estimate the monthly cost of an architecture it plans to build on AWS before it deploys anything. Which AWS tool should it use?',
    options: [
      'AWS Cost Explorer',
      'AWS Pricing Calculator',
      'AWS Budgets',
      'AWS Cost and Usage Reports',
    ],
    answer: [1],
    explanation:
      'The **AWS Pricing Calculator** creates cost estimates for planned AWS solutions before anything is deployed. Cost Explorer analyzes and forecasts based on past usage, AWS Budgets alerts on actual or forecasted spend, and the Cost and Usage Reports contain detailed data about existing usage.',
  },
  {
    id: 'cc-077',
    domain: 'cloud-concepts',
    question:
      'Which of the following is an example of undifferentiated heavy lifting that a company can stop doing when it moves to AWS?',
    options: [
      'Designing product features that are unique to the company',
      'Defining the business strategy',
      'Choosing which markets to target',
      'Racking servers and replacing failed hardware',
    ],
    answer: [3],
    explanation:
      '**Undifferentiated heavy lifting** is work that every company must do but that does not set it apart, such as racking servers and replacing failed hardware, which AWS takes over. Unique product features, business strategy, and market choices are what differentiate a company.',
  },
  {
    id: 'cc-078',
    domain: 'cloud-concepts',
    question:
      'A company connects its on-premises data center to AWS and runs some applications in each location, with the applications working together. Which cloud deployment model is this?',
    options: [
      'Cloud (all-in) deployment',
      'On-premises (private cloud) deployment',
      'Hybrid deployment',
      'Multi-Region deployment',
    ],
    answer: [2],
    explanation:
      'A **hybrid** deployment connects cloud-based resources with infrastructure that is not in the cloud, such as an on-premises data center. All-in cloud runs everything in the cloud, on-premises keeps everything in the company data center, and multi-Region describes an architecture within the cloud rather than a deployment model.',
  },
  {
    id: 'cc-079',
    domain: 'cloud-concepts',
    question:
      'A startup builds and runs all of its applications on AWS and has no data center of its own. Which cloud deployment model is this?',
    options: [
      'Cloud (all-in) deployment',
      'Hybrid deployment',
      'On-premises deployment',
      'Private cloud deployment',
    ],
    answer: [0],
    explanation:
      'In a **cloud** deployment, all parts of the application run in the cloud, either built there or migrated there. Hybrid combines cloud and on-premises resources, and on-premises (also called private cloud) deployment runs resources in a data center that the company operates itself.',
  },
  {
    id: 'cc-080',
    domain: 'cloud-concepts',
    question:
      'A company deploys resources in its own data center using virtualization and resource management tools, and does not use a public cloud. Which deployment model is this?',
    options: [
      'Hybrid deployment',
      'On-premises (private cloud) deployment',
      'Cloud (all-in) deployment',
      'Software as a service (SaaS)',
    ],
    answer: [1],
    explanation:
      'An **on-premises** deployment, also called a private cloud, uses virtualization and resource management tools in the company data center. Hybrid combines on-premises with the cloud, all-in cloud runs everything in the cloud, and SaaS is a service model rather than a deployment model.',
  },
  {
    id: 'cc-081',
    domain: 'cloud-concepts',
    question:
      'A company must keep some workloads in its own facility for low-latency access to on-site equipment, but wants to use the same AWS services, APIs, and tools as in the cloud. Which AWS service should it use?',
    options: ['AWS Snow Family', 'Amazon CloudFront', 'AWS Local Zones', 'AWS Outposts'],
    answer: [3],
    explanation:
      '**AWS Outposts** brings AWS infrastructure, services, APIs, and tools to a customer data center or on-premises facility, which supports hybrid deployments. The Snow Family is mainly for data transfer and disconnected edge computing, CloudFront delivers content, and Local Zones are AWS-operated locations rather than customer facilities.',
  },
  {
    id: 'cc-082',
    domain: 'cloud-concepts',
    question: 'Which of the following are common reasons for choosing a hybrid deployment model? (Choose two.)',
    options: [
      'Keeping certain data on premises to meet regulatory or data residency requirements',
      'Avoiding the use of any AWS services',
      'Migrating gradually while some legacy applications remain on premises',
      'Removing the need for network connectivity between environments',
      'Guaranteeing the lowest possible total cost',
    ],
    answer: [0, 2],
    explanation:
      'Hybrid deployments are often used to **keep some data or systems on premises** for regulatory reasons, or to **migrate gradually** while legacy applications stay on premises. A hybrid model uses AWS services, requires connectivity between environments, and does not guarantee the lowest cost.',
  },
  {
    id: 'cc-083',
    domain: 'cloud-concepts',
    question:
      'Which cloud service model gives the highest level of flexibility and management control over IT resources, such as with Amazon EC2 instances?',
    options: [
      'Software as a service (SaaS)',
      'Platform as a service (PaaS)',
      'Infrastructure as a service (IaaS)',
      'Desktop as a service (DaaS)',
    ],
    answer: [2],
    explanation:
      '**IaaS** provides access to networking, virtual servers, and storage, and gives the most flexibility and control, including over the operating system. PaaS removes the need to manage the underlying infrastructure, SaaS provides a complete application, and DaaS delivers virtual desktops.',
  },
  {
    id: 'cc-084',
    domain: 'cloud-concepts',
    question:
      'A development team wants to deploy a web application by uploading its code, without managing the operating system, servers, or capacity provisioning underneath it. Which cloud service model does this describe?',
    options: [
      'Infrastructure as a service (IaaS)',
      'Platform as a service (PaaS)',
      'Software as a service (SaaS)',
      'On-premises deployment',
    ],
    answer: [1],
    explanation:
      'With **PaaS**, such as AWS Elastic Beanstalk, you focus on deploying and managing your application while the provider manages the underlying infrastructure. IaaS requires managing the operating system, SaaS provides a finished application rather than a place to run your code, and on-premises is a deployment model.',
  },
  {
    id: 'cc-085',
    domain: 'cloud-concepts',
    question:
      'A company uses a web-based email product that the provider runs and manages completely; the company only uses the software. Which cloud service model is this?',
    options: [
      'Platform as a service (PaaS)',
      'Software as a service (SaaS)',
      'Infrastructure as a service (IaaS)',
      'Hybrid deployment',
    ],
    answer: [1],
    explanation:
      '**SaaS** provides a complete product that the service provider runs and manages, such as web-based email, so the customer only thinks about how to use it. PaaS and IaaS require the customer to deploy or manage applications, and hybrid is a deployment model.',
  },
  {
    id: 'cc-086',
    domain: 'cloud-concepts',
    question: 'Which statements about cloud service models are correct? (Choose two.)',
    options: [
      'With SaaS, the customer applies operating system patches to the application servers',
      'With IaaS, the customer typically manages the operating system and applications',
      'With PaaS, the customer is responsible for the physical servers',
      'With IaaS, AWS patches the guest operating system for the customer',
      'With SaaS, the provider runs and manages the complete application',
    ],
    answer: [1, 4],
    explanation:
      'With **IaaS**, such as Amazon EC2, the customer manages the guest operating system and applications, and with **SaaS** the provider runs and manages the entire application. SaaS customers do not patch servers, PaaS customers do not manage physical servers, and AWS does not patch the guest OS of EC2 instances for the customer.',
  },
  {
    id: 'cc-087',
    domain: 'cloud-concepts',
    question:
      'As a company moves from IaaS to PaaS to SaaS, how does the division of management responsibility generally change?',
    options: [
      'The customer manages more of the underlying infrastructure',
      'The customer gains more control over the operating system',
      'The customer manages less of the stack, and the provider manages more',
      'The provider manages less of the stack, and the customer manages more',
    ],
    answer: [2],
    explanation:
      'Moving from IaaS to PaaS to SaaS, the provider takes on more of the stack (infrastructure, then platform, then the application), so **the customer manages less**. That also means the customer has less control over the operating system, not more, and the other options describe the reverse.',
  },
  {
    id: 'cc-088',
    domain: 'cloud-concepts',
    question:
      'Which of the following are general design principles of the AWS Well-Architected Framework? (Choose two.)',
    options: [
      'Use a single Availability Zone to reduce latency',
      'Provision capacity for the expected peak',
      'Test systems at production scale',
      'Drive architectures using data',
      'Freeze the architecture after the initial design',
    ],
    answer: [2, 3],
    explanation:
      'The general design principles include **test systems at production scale** and **drive architectures using data**, along with stop guessing capacity, automate to make experimentation easier, allow for evolutionary architectures, and improve through game days. A single AZ is a single point of failure, provisioning for peak is guessing capacity, and freezing the design contradicts evolutionary architectures.',
  },
  {
    id: 'cc-089',
    domain: 'cloud-concepts',
    question:
      'A media company wants to deliver videos and images to users around the world with low latency by caching content at locations close to them. Which AWS service should it use?',
    options: ['AWS Outposts', 'Amazon CloudFront', 'AWS Direct Connect', 'AWS Snow Family'],
    answer: [1],
    explanation:
      '**Amazon CloudFront** is a content delivery network that caches content at edge locations around the world to reduce latency for users. Outposts runs AWS infrastructure on premises, Direct Connect is a private network connection to AWS, and the Snow Family moves data on physical devices.',
  },
  {
    id: 'cc-090',
    domain: 'cloud-concepts',
    question: 'Which of the following describe how the AWS Cloud increases speed and agility? (Choose two.)',
    options: [
      'New IT resources are only a click away',
      'Hardware procurement cycles become longer',
      'Experiments cost less because resources can be released when they are no longer needed',
      'Customers must forecast capacity years in advance',
      'All workloads are automatically refactored for the cloud',
    ],
    answer: [0, 2],
    explanation:
      'In the cloud, **new IT resources are only a click away**, and because you can release resources when you are done, **the cost and time of experimentation drop**. The cloud removes hardware procurement cycles and the need for long capacity forecasts, and it does not refactor workloads automatically.',
  },
];
