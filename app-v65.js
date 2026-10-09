const customers=[
{id:"BL",name:"BL",short:"BL",detail:"Customer code"},
{id:"IS",name:"IS",short:"IS",detail:"Customer code"},
{id:"HC",name:"HC",short:"HC",detail:"Customer code"},
{id:"KI",name:"KI",short:"KI",detail:"Customer code"},
{id:"TD",name:"TD",short:"TD",detail:"Customer code"},
{id:"PS",name:"PS",short:"PS",detail:"Customer code"},
{id:"BHC",name:"BHC",short:"BHC",detail:"Customer code"},
{id:"CPF",name:"CPF",short:"CPF",detail:"Customer code"},
{id:"MAN",name:"MAN",short:"MAN",detail:"Customer code"},
{id:"CB",name:"CB",short:"CB",detail:"Customer code"},
{id:"RB",name:"RB",short:"RB",detail:"Customer code"},
{id:"8F",name:"8F",short:"8F",detail:"Customer code"}
];

const types=[
"Account Administration","Administration","Assisting Other Departments","Business Profile","Cadence Call",
"Change Management – Implementation","Change Management – Planning","Consultation","DC/SOW Review",
"Discovery Call/SoW","Documentation","ES Onboarding","Event","Feature Request Discussion","Health Check",
"Initiative","Meeting","Mentoring","One-on-One","Other","P1/Escalation","QBR","Release Manifest Testing",
"Research","SME Activity","Internal Sync","Training","Troubleshooting","Webinars","Work Order","Special Initiative"
];

const $=s=>document.querySelector(s);
let activeCustomer=null;
let selectedHours=1;
let editingId=null;
let saveLocked=false;
let wheelAngle=0,wheelActive=false,wheelDragging=false,wheelStartY=0,wheelStartAngle=0,wheelMoved=false;
let historicalFilter="all";
let historicalMonth=null;
let historicalQuarter=null;
let multiDateFilter="all";
let catchupContext=null;
let vacationEditingMonth=null;
const HISTORY_START="2026-08-01";
const expandedHistoricalDays=new Set();

const historicalSubmitted={
  "2026-08-10":{hours:9.5,breakdown:{"PS":0.5,"KI":3,"HC":1.5,"CPF":1.5,"RB":3}},
  "2026-08-11":{hours:7,breakdown:{"PS":2,"IS":2.5,"HC":2.5}},
  "2026-08-12":{hours:7,breakdown:{"PS":1.5,"HC":2.5,"OT":3}},
  "2026-08-13":{hours:7,breakdown:{"PS":2,"HC":1.5,"BL":2,"OT":1.5}},
  "2026-08-14":{hours:7.5,breakdown:{"PS":0.5,"MAN":1,"IS":2,"TD":2,"HC":2}},
  "2026-08-17":{hours:6.5,breakdown:{"PS":3.5,"IS":1.5,"OT":1.5}},
  "2026-08-18":{hours:6.5,breakdown:{"PS":4,"OT":2.5}},
  "2026-08-19":{hours:6,breakdown:{"HC":3,"WM":2.5,"PS":0.5}},
  "2026-08-20":{hours:6.5,breakdown:{"PS":5,"KI":1.5}},
  "2026-08-21":{hours:7,breakdown:{"PS":1.5,"CRC":1.5,"IS":1.5,"BL":2.5}},
  "2026-08-24":{hours:7,breakdown:{"PS":0.5,"KI":1.5,"IS":1.5,"BL":3.5}},
  "2026-08-25":{hours:10.5,breakdown:{"PS":6.5,"CPF":2,"HC":2}},
  "2026-08-26":{hours:7,breakdown:{"PS":3,"IS":1,"OT":1.5,"KI":1.5}},
  "2026-08-27":{hours:7,breakdown:{"PS":3.5,"HC":1.5,"KI":2}},
  "2026-08-28":{hours:7.5,breakdown:{"PS":1,"TD":3,"BL":1.5,"IS":2}},
  "2026-08-31":{hours:5.5,breakdown:{"PS":4,"IS":1.5}},
  "2026-09-01":{hours:7,breakdown:{"PS":1.5,"HC":2.5,"BL":0.5,"KI":2.5}},
  "2026-09-02":{hours:7,breakdown:{"PS":4,"KI":1.5,"IS":1.5}},
  "2026-09-03":{hours:7,breakdown:{"PS":3.5,"BL":3.5}},
  "2026-09-04":{hours:7,breakdown:{"PS":4.5,"HC":2.5}},
  "2026-09-07":{hours:0.5,breakdown:{"PS":0.5}},
  "2026-09-08":{hours:7,breakdown:{"KI":3.5,"PS":3.5}},
  "2026-09-09":{hours:8.5,breakdown:{"BL":3.5,"PS":3.5,"KI":1.5}},
  "2026-09-10":{hours:7,breakdown:{"PS":4.5,"HC":2.5}},
  "2026-09-11":{hours:4.5,breakdown:{"IS":1,"PS":3.5}},
  "2026-09-14":{hours:5.5,breakdown:{"PS":3.5,"CRC":2}},
  "2026-09-15":{hours:3.5,breakdown:{"PS":3.5}},
  "2026-09-16":{hours:3.5,breakdown:{"PS":3.5}},
  "2026-09-17":{hours:3.5,breakdown:{"PS":3.5}},
  "2026-09-18":{hours:7,breakdown:{"PS":5.5,"IS":1.5}},
  "2026-09-21":{hours:7,breakdown:{"OT":7}},
  "2026-09-22":{hours:7,breakdown:{"OT":7}},
  "2026-09-23":{hours:7,breakdown:{"OT":7}},
  "2026-09-24":{hours:7,breakdown:{"PS":7}},
  "2026-09-25":{hours:7,breakdown:{"PS":7}},
  "2026-09-28":{hours:3.5,breakdown:{"PS":3.5}},
  "2026-09-29":{hours:4.5,breakdown:{"PS":3.5,"KI":1}},
  "2026-09-30":{hours:3.5,breakdown:{"PS":3.5}},
  "2026-10-01":{hours:7,breakdown:{"PS":1.5,"IS":5.5}},
  "2026-10-02":{hours:4.5,breakdown:{"PS":3.5,"BL":1}},
  "2026-10-05":{hours:6,breakdown:{"PS":3.5,"MAN":1,"BHC":0.5,"CPF":1}},
  "2026-10-06":{hours:7,breakdown:{"PS":5.5,"RB":1.5}},
  "2026-10-07":{hours:0.5,breakdown:{"PS":0.5}},
  "2026-10-08":{hours:0.5,breakdown:{"PS":0.5}},
  "2026-10-09":{hours:5,breakdown:{"MAN":1,"TD":1,"IS":1,"BL":1,"PS":1}},
  "2026-10-12":{hours:0.5,breakdown:{"PS":0.5}},
  "2026-10-13":{hours:0.5,breakdown:{"PS":0.5}},
  "2026-10-14":{hours:0.5,breakdown:{"PS":0.5}},
  "2026-10-15":{hours:0.5,breakdown:{"PS":0.5}},
  "2026-10-16":{hours:0.5,breakdown:{"PS":0.5}},
  "2026-10-19":{hours:0.5,breakdown:{"PS":0.5}},
  "2026-10-20":{hours:0.5,breakdown:{"PS":0.5}},
  "2026-10-21":{hours:0.5,breakdown:{"PS":0.5}}
};

const SALESFORCE_SNAPSHOT_RECORD_COUNT=163;
const SALESFORCE_SNAPSHOT_TOTAL_HOURS=274.5;

const historicalDetails={
  "2026-08-10":[
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"},
    {accountCode:"KI",type:"Troubleshooting",hours:3,details:"Working with Josh from Kiosk on a development application upgrade package. Josh was provided a zip and needs to update all handhelds with the latest version of Aspira in lockdown configuration. Working with Josh on testing this in an isolated profile assignment and package creation."},
    {accountCode:"HC",type:"Initiative",hours:1.5,details:"Spending time with sales ops and Julie (AM) to determine what needs to be done when transferring license ownership from User account to MSP Legacy."},
    {accountCode:"CPF",type:"Troubleshooting",hours:1.5,details:"Created script and shared with Yash to review the status of apps installed on iOS devices. Josh mentioned that for the most part apps are installing now and everything seems fine. Regardless, we have a query to review if needed."},
    {accountCode:"RB",type:"Troubleshooting",hours:3,details:"Upgrading environment with Anton. Had to troubleshoot installation error that was complaining about signal database."}
  ],
  "2026-08-11":[
    {accountCode:"PS",type:"Initiative",hours:1.5,details:"working on XSight maturity model"},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"},
    {accountCode:"IS",type:"Troubleshooting",hours:2.5,details:"Reviewing issue Jeff is running into with regards to space and OS upgrade files they require to upload for specific sites. Determined we have space however, everything is pointing to C drive instead of temp where we have 150GB free in comparison to C where we have 3 GB free."},
    {accountCode:"HC",type:"Xsight Initiative",hours:2.5,details:"Meeting with Allen to discuss XSight initiatives and how to move forward with displaying value for his customers that have B13 bundle."}
  ],
  "2026-08-12":[
    {accountCode:"PS",type:"Meeting",hours:1,details:"Working on XSight maturity model"},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"},
    {accountCode:"HC",type:"Troubleshooting",hours:1,details:"Submitting cloud ticket to swap regkeys on server and request server be deleted."},
    {accountCode:"OT",type:"Troubleshooting",hours:3,details:"working with Shawn to troubleshoot Zebra software package deployment and OEM config troubleshooting. We may just have to use file sync with the json file for config."},
    {accountCode:"HC",type:"Troubleshooting",hours:1.5,details:"Working with sales operations to correct the SIT for one of Allen's MobiControl instances."}
  ],
  "2026-08-13":[
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"},
    {accountCode:"PS",type:"Xsight Initiative",hours:1.5,details:"Held meeting with local XSight team. explained the project summary and prescriptive guidance tab, and established a tracking methodology for xsight adoption journey steps."},
    {accountCode:"HC",type:"Troubleshooting",hours:1.5,details:"Reviewing multi tenant permission issues for heartland. Issue is resolved through tenant de-linking and re-linking. Looking into permanent solution."},
    {accountCode:"BL",type:"Troubleshooting",hours:2,details:"Working with Nathan on determining what is causing the cellular dashboard not to load. Investigating and looking into JIRAs. JIRA XS-35226 solved the issue for us. Ran the sql cmd and the issue is now addressed."},
    {accountCode:"OT",type:"Troubleshooting",hours:1.5,details:"Coordinated a support engagement with Vishal regarding an OnTrac application deployment issue involving APK and JSON files. Discussed troubleshooting approach, scheduled a customer working session, and requested support resources while the primary engineer was out of office"}
  ],
  "2026-08-14":[
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"},
    {accountCode:"MAN",type:"Cadence Call",hours:1,details:"Reviewed ongoing support items and customer questions. Received update from Denise Gutierrez Maldonado that a previous AAB file support discussion had been resolved as a feature request for a future MobiControl release"},
    {accountCode:"IS",type:"Cadence Call",hours:2,details:"Reviewed server storage constraints, ET40 and Ozone OS upgrade planning, Velocity licensing bottlenecks, device update workflows, and backend troubleshooting approaches. Discussed server drive allocation issues, application deployment status monitoring, and future support planning for the Hurricane deployment project. Follow-up actions included server space remediation, historical log review, and Velocity licensing investigation."},
    {accountCode:"TD",type:"Xsight Initiative",hours:2,details:"Discussed creating a restricted operator role that would allow customer personnel to view only their assigned device groups and Live View data. Worked through role-based access testing, Live View visibility, operational metrics, battery/network visibility, and viewer-style access requirements. Action items included continuing development of a custom viewer role and refining permissions."},
    {accountCode:"HC",type:"Initiative",hours:2,details:"Participated in discussions regarding server decommissioning and cloud infrastructure cleanup. Worked with Julie Mclenahan and cloud teams regarding server A0034004 decommissioning confirmation and registry key updates. Also updating asset notes per instance for the heartland team."}
  ],
  "2026-08-17":[
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"},
    {accountCode:"PS",type:"Xsight Initiative",hours:2,details:"continued working on xsight maturity model. Completing all questions for journey steps."},
    {accountCode:"IS",type:"Troubleshooting",hours:1.5,details:"Reviewed confirmation that development server storage modifications resolved upload issues experienced by the customer"},
    {accountCode:"OT",type:"Troubleshooting",hours:1.5,details:"OnTrac APK Deployment Monitored follow-up communications from Support regarding the APK deployment investigation initiated the previous day. Continued collaboration with Support Engineering while customer testing progressed."},
    {accountCode:"PS",type:"Xsight Initiative",hours:1,details:"Met with Sia Harlalka regarding a custom dashboard feature request and held an ad-hoc discussion around planning next steps."}
  ],
  "2026-08-18":[
    {accountCode:"PS",type:"Initiative",hours:1.5,details:"Continued with XSight maturity model"},
    {accountCode:"PS",type:"Xsight Initiative",hours:2.5,details:"Continued working on XSight Maturity model. Completing questions and answers for journey steps."},
    {accountCode:"OT",type:"Troubleshooting",hours:2.5,details:"ockdown / Aspira Kiosk Application Investigation Continued troubleshooting around the Aspira application and Kiosk lockdown configuration. Coordinated with Josh Cirbo and William Lawrence regarding a dedicated test environment and test device (Aspira Bench 03) for validation. Reviewed requirements around: Maintaining Aspira in the foreground at all times. Ensuring KCF services start before Aspira launches. Testing single-app mode and kiosk lockdown behavior. Validating production-safe changes using isolated testing profiles. Requested test credentials and began detailed troubleshooting against the customer's UAT environment."}
  ],
  "2026-08-19":[
    {accountCode:"HC",type:"Troubleshooting",hours:1.5,details:"IM-28365 - reviewing and testing the following JIRA. Looks like this has been addressed for MobiControl but for XSight apps we are still seeing N/A information."},
    {accountCode:"HC",type:"Other",hours:1.5,details:"Assisting Liz from Heartland update a list of servers and their asset information."},
    {accountCode:"WM",type:"Troubleshooting",hours:2.5,details:"Weis Markets Strategic Monthly Touchpoint You hosted Weis Markets & SOTI | Strategic Monthly touch point with the Weis team to review operational health, device lifecycle planning, XSight initiatives, and open technical concerns. Topics discussed: Android upgrade strategy and migration planning toward Android 14. Follow-up planning for Operational Intelligence/XSight adoption, including metrics around battery, Wi-Fi, cellular, location, and workflow visibility. Ongoing certificate enrollment issues impacting devices and troubleshooting around trusted root/intermediate certificate requirements. Budgetary planning for future device growth, with projections discussed for approximately 4,600 devices. SOTI World Tour planning and customer engagement opportunities. Follow-up actions assigned to you: Review previous root CA configuration. Follow up on certificate troubleshooting and validation activities."},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team meeting"}
  ],
  "2026-08-20":[
    {accountCode:"PS",type:"Meeting",hours:3,details:"continued working on XSight maturity model"},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"},
    {accountCode:"PS",type:"Other",hours:1.5,details:"TAM Transition Planning - walking Tom through accounts that will be transitioned. Champion Petfoods, Baptist Health Care, CR California,"},
    {accountCode:"KI",type:"Troubleshooting",hours:1.5,details:"Aspira / Lockdown Configuration Troubleshooting Continued working with Josh Cirbo and the KIOSK team on the Aspira kiosk deployment. Activity included: Troubleshooting co-running applications. Reviewing startup sequencing requirements between KCF and Aspira. Investigating lockdown profile behavior. Coordinating testing using the \"Aspira Bench 03\" UAT device. Following up on availability of test credentials and validation procedures."}
  ],
  "2026-08-21":[
    {accountCode:"PS",type:"Initiative",hours:1,details:"Continued work on XSight maturity model"},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"},
    {accountCode:"CRC",type:"Cadence Call",hours:1.5,details:"organized and hosted the CR California & SOTI Strategic Touchpoint Monthly. Discussion included: MobiControl upgrade planning. Dev-versus-production upgrade strategy. Blackout windows and change control planning. XSight and SNAP reintroduction planning. Internal training and knowledge transfer initiatives. NICE CXone tablet launch use case exploration. Action Items Coordinate development environment upgrade. Build customer training package with Tom Cheung. Investigate NICE CXone tablet launcher options. Prepare change management documents. Re-demonstrate SNAP and XSight after upgrades."},
    {accountCode:"IS",type:"Cadence Call",hours:1.5,details:"hosted the IntegraServ & SOTI Weekly Touch Point. Topics included: Android and OS upgrade planning. Server storage limitations impacting file synchronization. Dev server upgrade planning. Large-scale device deployments and update strategy. Custom attribute and reporting enhancements. Review of rollout challenges impacting hundreds of devices. Action Items Coordinate downtime approval for storage expansion. Notify team regarding server upgrades. Coordinate production alignment activities."},
    {accountCode:"BL",type:"Cadence Call",hours:2.5,details:"Monthly Cadence Meeting led the BLUELINX & SOTI - Monthly Cadence meeting covering: XSight visibility and environment upgrade planning. Cellular dashboard issue review and resolution. Bulk device renaming requests. Android Enterprise private APN deployment discussions. Firmware upgrade processes for Zebra, Samsung, and iOS devices. Investigation of the HighRadius Pay & Remit application crash issue. Review of lockdown profile impacts and troubleshooting findings. Action Items Schedule APN working session with customer stakeholders. Schedule follow-up issue review session for Vahn Moody."}
  ],
  "2026-08-24":[
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"},
    {accountCode:"KI",type:"Other",hours:1.5,details:"KIOSK - Assisted on an active customer migration planning initiative involving: MobiControl client migration. Tenant migration planning. Updated quote and project continuation discussions."},
    {accountCode:"IS",type:"Troubleshooting",hours:1.5,details:"Storage Expansion / Cloud Upgrade Coordination Coordinated directly with Kedar Kamat regarding: Additional 20 GB storage requirements. Downtime approval. Dev server alignment with production. Cloud ticket submission and planning"},
    {accountCode:"BL",type:"Troubleshooting",hours:1.5,details:"HighRadius Pay & Remit Investigation worked with Nathan Hill reviewing: ADB logs. Device-side error messages. Lockdown profile behavior. Script execution failures. App crash troubleshooting."},
    {accountCode:"BL",type:"Troubleshooting",hours:2,details:"prepping and attending 2 working sessions with Nathan and the customer (Demitrius and Vahn)."}
  ],
  "2026-08-25":[
    {accountCode:"PS",type:"Initiative",hours:1.5,details:"XSight Maturity Model - continued work on web application."},
    {accountCode:"PS",type:"Initiative",hours:2,details:"XSight maturity model - continued work on web application."},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"},
    {accountCode:"PS",type:"Xsight Initiative",hours:2.5,details:"MCP / OAuth / QA Environment Testing spent time working with: Dhairya Sheth Ajit Mittal Activities included: XSight MCP testing. QA environment connectivity. OAuth endpoint validation. TLS certificate troubleshooting. MCP Inspector troubleshooting. LiveView API testing."},
    {accountCode:"CPF",type:"Troubleshooting",hours:2,details:"Customer Josh Watson escalated ongoing MobiControl application deployment failures affecting business-critical iPads. Activities included: Reviewing deployment data before and after the 2025.4.1 upgrade. Analyzing Deployment Server activity. Reviewing VPP licensing workflows. Reviewing APNS and Apple deployment activity. Validating affected devices. Preparing a detailed customer response and remediation plan. Coordinating escalation strategy with Yash Chawda. Providing executive-level ownership of the investigation."},
    {accountCode:"HC",type:"Xsight Initiative",hours:2,details:"hosted a working session with Allen Thompson focused on XSight adoption and Operational Intelligence strategy. Discussion included: XSight roadmap feedback and product direction. Operational Intelligence dashboard requirements. Potential future API access and custom dashboard capabilities. Telemetry validation and readiness. Custom attribute implementation tied to device groups and physical locations. XSight upgrade planning. Coordination with Sean regarding environment configuration"}
  ],
  "2026-08-26":[
    {accountCode:"PS",type:"Initiative",hours:1.5,details:"XSight Maturity model work - continued the development of the web application."},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"},
    {accountCode:"IS",type:"Troubleshooting",hours:1,details:"Workwear Outfitters (Through IntegraServ) became involved in a device-freezing escalation. Activities included: CT47 freeze investigation. Honeywell log review coordination. Evaluation of Google authentication errors. Review of device-level behavioral indicators. Coordination with Michael Sharpe."},
    {accountCode:"OT",type:"Cadence Call",hours:1.5,details:"Preparing & Hosted the OnTrac cadence meeting with Raj Pandey and customer stakeholders. Topics included: Warehouse application deployment failures. Package version management. App profile design strategy. Device enrollment challenges. Scanner testing strategy. SOTI Connect visibility concerns. MQTT printer monitoring issues. Action Items Investigate printer visibility issues in SOTI Connect. Coordinate follow-up with customer. Bring Raj Pandey into ongoing account management activities."},
    {accountCode:"PS",type:"Other",hours:1,details:"Account transition - Time with Sanjidha Chowdhury reviewing the KIOSK environment, customer requirements, lockdown configuration issues, log collection options, and customer architecture."},
    {accountCode:"KI",type:"Troubleshooting",hours:1.5,details:"led a deep-dive troubleshooting session involving: Aspira kiosk application behavior. KCF service startup issues. Lockdown profile design. Single App Mode behavior. Script-based service startup testing. Task Scheduler automation. Device monitoring requirements. XSight visibility requirements. Watchdog and auto-restart discussions."}
  ],
  "2026-08-27":[
    {accountCode:"PS",type:"Meeting",hours:3,details:"continued working on XSight maturity model."},
    {accountCode:"HC",type:"Meeting",hours:1.5,details:"Working with Liz regarding heartland portal asset records and MSP note updates."},
    {accountCode:"KI",type:"Cadence Call",hours:2,details:"KIOSK / Blue Yonder Working Session Topics covered Designing a separate SOTI environment for Blue Yonder. Determining how to isolate Blue Yonder from KIOSK-managed fleets. White-label support model discussions. XSight operational monitoring capabilities. Device uptime and reboot visibility. App monitoring and watchdog scenarios. KCF / HIM service monitoring. Android log collection and API automation options. REST API validation for retrieving logs. Network diagnostics and telemetry visibility."},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"}
  ],
  "2026-08-28":[
    {accountCode:"PS",type:"Other",hours:0.5,details:"Opening internal case for laptop replacement with IT."},
    {accountCode:"TD",type:"Initiative",hours:3,details:"hosted Taylor Data Systems | Strategic touchpoints. Discussion points and action items: Missing MobiControl Live View permissions and roles. Whether upgrading would restore missing functionality. Testing against the 2026 environment before any upgrade. App performance issues involving Realm database contention and UI freezes. XSight telemetry and application monitoring capabilities."},
    {accountCode:"BL",type:"Meeting",hours:1.5,details:"conducted a BlueLinx Overview session with Steve Langan. Topics covered: Overview of the BlueLinx environment and customer relationship. XSight adoption and application monitoring discussions. Samsara usage and data-consumption trends. Open support cases and CIP synchronization issues. Customer stakeholders including Demetrius, Vaughn, and John. Upcoming account transition planned for November 1"},
    {accountCode:"IS",type:"Cadence Call",hours:2,details:"led IntegraServ & SOTI weekly touch point. The discussion focused on intermittent freezing issues affecting Honeywell Android devices. Reviewed device logs, management logs, and server performance. Investigated Google Play authentication failures and possible network interruptions. Determined there was no clear evidence of a SOTI platform issue. Discussed support boundaries because the customer was not under a managed services agreement. Agreed that additional troubleshooting required more precise timestamps and reproducible steps."},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"}
  ],
  "2026-08-31":[
    {accountCode:"PS",type:"Other",hours:3.5,details:"continued working on the xsight maturity model."},
    {accountCode:"IS",type:"Other",hours:1.5,details:"Working with Kedar. Informed them that storage on the server had been upgraded and tey could begin uploading files before their on site visit to HC distribution centre."},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"}
  ],
  "2026-09-01":[
    {accountCode:"PS",type:"Initiative",hours:1,details:"Continued working on xsight maturity model."},
    {accountCode:"HC",type:"Troubleshooting",hours:2.5,details:"Customer reporting issue on Honeywell CK65 devices. The issue involved: SOTI Surf Honeywell CK65 devices Android 13 Session drops occurring while devices operate in kiosk mode Customer suspicion that kiosk mode or session-management behavior was contributing to the problem"},
    {accountCode:"BL",type:"Initiative",hours:0.5,details:"following up with Vahn as he's sick and out of office today. Looking to reschedule this meeting."},
    {accountCode:"KI",type:"Initiative",hours:2.5,details:"clarify the situation for Sachin Kohli, explaining that Raja's request was referring to the migration quote that had expired, rather than the SOC 2 documentation conversation. In addition, This migration project involved: Moving client devices to a new MobiControl instance. Questions around migration planning and deployment. Coordination between SOTI and KIOSK stakeholders."},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"}
  ],
  "2026-09-02":[
    {accountCode:"PS",type:"Meeting",hours:2.5,details:"Continued working on maturity model"},
    {accountCode:"KI",type:"Meeting",hours:1.5,details:"Received signed quote from Raja. Reaching out to AM to answer security and compliance question customer has regarding SOC2 and ISO."},
    {accountCode:"IS",type:"Initiative",hours:1.5,details:"actively working with the IS team around environment readiness and customer planning before onsite visit."},
    {accountCode:"PS",type:"Meeting",hours:1,details:"XSight maturity model team meeting to discuss progress"},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"}
  ],
  "2026-09-03":[
    {accountCode:"PS",type:"Initiative",hours:3,details:"Continued working on maturity model."},
    {accountCode:"BL",type:"Troubleshooting",hours:3.5,details:"BlueLinx Working Session Key topics discussed: -Troubleshooting the Pay & Remit application issue. -Discovery that removing the MRDC Lockdown Profile resolved the problem. -Investigation narrowed to Application Run Control settings inside the lockdown profile. -Agreement to test using a cloned lockdown profile and isolate the offending setting. -Discussion around production deployment and CAB approval. -Planning a separate firmware update session involving John Lewis. -Review of APAC configuration issues and next steps. Action items for me: -Schedule the firmware update working session and include John Lewis"},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"}
  ],
  "2026-09-04":[
    {accountCode:"PS",type:"Initiative",hours:4,details:"Continued working on XSight maturity model"},
    {accountCode:"HC",type:"Initiative",hours:2,details:"HL Port Review Session Conducted a Working Session to review ports with customer."},
    {accountCode:"HC",type:"Initiative",hours:0.5,details:"(Correcting total hours) HL Port Review Session Conducted a Working Session to review ports with customer."},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"}
  ],
  "2026-09-07":[
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"}
  ],
  "2026-09-08":[
    {accountCode:"KI",type:"Troubleshooting",hours:3.5,details:"Troubleshooting database growth: MC Archive database capacity issues. SQL Express database size limitations. Options to: Truncate OLTP data. Move the database to a different disk. Upgrade SQL Express to a newer release with increased database limits. Downtime considerations for each approach. Coordinating Cloud and Support teams if an upgrade became necessary."},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"},
    {accountCode:"PS",type:"Xsight Initiative",hours:3,details:"Continued working on XSight adoption web engine."}
  ],
  "2026-09-09":[
    {accountCode:"BL",type:"Meeting",hours:1.5,details:"Working session to discuss best practices with customer regarding firmware upgrade process."},
    {accountCode:"PS",type:"Initiative",hours:3,details:"XSight Maturity Model meeting to discuss progress and next steps. Then continued working on the maturity model."},
    {accountCode:"KI",type:"Meeting",hours:1.5,details:"Meeting with AM to discuss customer review, and current motions."},
    {accountCode:"BL",type:"Initiative",hours:2,details:"Setting up working session with bluelinx team to discuss best practices upgrading the firmware of samsung e-fota devices, apple devices, and android zebra devices."},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Morning team meeting"}
  ],
  "2026-09-10":[
    {accountCode:"PS",type:"Initiative",hours:2.5,details:"Continued work on maturity model."},
    {accountCode:"HC",type:"Initiative",hours:2.5,details:"discussed customer facing documentation to be shared with customer. Reviewing a sample PDF provided by customer. Troubleshooting file access and sharepoint doc links. Planning a final review session before sending material to customer."},
    {accountCode:"PS",type:"Event",hours:1.5,details:"Visiting vendor printer ecosystem overview session."},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"}
  ],
  "2026-09-11":[
    {accountCode:"IS",type:"Cadence Call",hours:1,details:"Cadence call with IS."},
    {accountCode:"PS",type:"Initiative",hours:3,details:"Continued working on XSight maturity model"},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"}
  ],
  "2026-09-14":[
    {accountCode:"PS",type:"Initiative",hours:3,details:"Continued working on XSight maturity model"},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"},
    {accountCode:"CRC",type:"Other",hours:2,details:"Account Review with Jay Rami and Tom to discuss CR California. The current status for renewal and areas of interest their teams would like to explore with regards to SOTI one products. Snap was demoed for a return application that Erin and her team would use to replace the manual process of returns. This was demonstrated and the customer loved it however, timing was not right. We also want to revisit xsight for operational intelligence like Wifi health number of disconnects across the retail stores, lockdown screens if a device leaves the store."}
  ],
  "2026-09-15":[
    {accountCode:"PS",type:"Initiative",hours:3,details:"Continued working on XSight maturity model"},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"}
  ],
  "2026-09-16":[
    {accountCode:"PS",type:"Initiative",hours:3,details:"Continued working on XSight maturity model"},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"}
  ],
  "2026-09-17":[
    {accountCode:"PS",type:"Initiative",hours:3,details:"Continued working on XSight maturity model"},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"}
  ],
  "2026-09-18":[
    {accountCode:"PS",type:"Other",hours:2,details:"Team lunch."},
    {accountCode:"IS",type:"Cadence Call",hours:1.5,details:"Cadence call with IS: customer reported very slow downloads and intermittent connectivity from 1 DC. reviewed XSight network data and identified a concentration of disconnect activity around a specific access point. Approximately 1,340 disconnects across 138 devices were discussed for the analyzed timeframe. Possible causes included access point issues, bandwidth constraints, firmware, or site network conditions."},
    {accountCode:"PS",type:"Initiative",hours:3,details:"Continued working on XSight maturity model"},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"}
  ],
  "2026-09-21":[
    {accountCode:"OT",type:"Other",hours:7,details:"Travelling to onsite QBR"}
  ],
  "2026-09-22":[
    {accountCode:"OT",type:"QBR",hours:7,details:"Walk through of data center and delivered QBR onsite."}
  ],
  "2026-09-23":[
    {accountCode:"OT",type:"Other",hours:7,details:"Travelling back from QBR onsite."}
  ],
  "2026-09-24":[
    {accountCode:"PS",type:"Xsight Initiative",hours:7,details:"Continued working on XSight"}
  ],
  "2026-09-25":[
    {accountCode:"PS",type:"Xsight Initiative",hours:7,details:"Continued working on XSight web engine"}
  ],
  "2026-09-28":[
    {accountCode:"PS",type:"Initiative",hours:3,details:"Continued working on XSight maturity model"},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"}
  ],
  "2026-09-29":[
    {accountCode:"PS",type:"Initiative",hours:3,details:"Continued working on XSight maturity model"},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"},
    {accountCode:"KI",type:"Other",hours:1,details:"Raja (customer) is ready to proceed with the migration of 30 of his devices into the new environment. However, the new environment is expired, and server is no longer there."}
  ],
  "2026-09-30":[
    {accountCode:"PS",type:"Initiative",hours:3,details:"Continued working on XSight maturity model"},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"}
  ],
  "2026-10-01":[
    {accountCode:"PS",type:"Other",hours:1.5,details:"Continued work on maturity model."},
    {accountCode:"IS",type:"Troubleshooting",hours:2.5,details:"Continue assisting Jeff and Michael with attempting to identify the slowness to the profile download package in Tifton. It seems only one profile is impacted and that is the ZDNA which is about 60 MB and taken about 15 to 20 minutes to download."},
    {accountCode:"IS",type:"Troubleshooting",hours:3,details:"Assisting Jeff and Michael with a profile download issue at the Tifton distribution centre reviewing DS logs"}
  ],
  "2026-10-02":[
    {accountCode:"PS",type:"Initiative",hours:3,details:"Continued working on XSight maturity model"},
    {accountCode:"BL",type:"Meeting",hours:1,details:"Reviewing recording, as I was not able to attend"},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Morning meeting with the team Anu."}
  ],
  "2026-10-05":[
    {accountCode:"PS",type:"Initiative",hours:3,details:"Continued working on XSight maturity model"},
    {accountCode:"MAN",type:"Troubleshooting",hours:1,details:"Working with Jamal on updating devices time zone via mx config."},
    {accountCode:"BHC",type:"Meeting",hours:0.5,details:"Reviewing account and preparing account for transition to tam"},
    {accountCode:"CPF",type:"Meeting",hours:1,details:"Spence time updating new tam (Metsahit) accounts"},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team meeting"}
  ],
  "2026-10-06":[
    {accountCode:"PS",type:"Meeting",hours:1.5,details:"Meeting with Michael to discuss DoorDash"},
    {accountCode:"PS",type:"Other",hours:3.5,details:"Continue working on maturity model."},
    {accountCode:"RB",type:"Cadence Call",hours:1.5,details:"Prepping for cadence call an attending kids call with Customer, Nick and Mark."},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning Meeting"}
  ],
  "2026-10-07":[
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"}
  ],
  "2026-10-08":[
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"}
  ],
  "2026-10-09":[
    {accountCode:"MAN",type:"Cadence Call",hours:1,details:"Cadence call with Customer"},
    {accountCode:"TD",type:"Cadence Call",hours:1,details:"Cadence call with Customer"},
    {accountCode:"IS",type:"Cadence Call",hours:1,details:"Cadence call with Customer"},
    {accountCode:"BL",type:"Cadence Call",hours:1,details:"Cadence call with Customer"},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"meeting with TJ"},
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning Meeting"}
  ],
  "2026-10-12":[
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team meeting with the Anu team"}
  ],
  "2026-10-13":[
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu meeting"}
  ],
  "2026-10-14":[
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"}
  ],
  "2026-10-15":[
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"}
  ],
  "2026-10-16":[
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meeting"}
  ],
  "2026-10-19":[
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning Meeting"}
  ],
  "2026-10-20":[
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning Meeting"}
  ],
  "2026-10-21":[
    {accountCode:"PS",type:"Meeting",hours:0.5,details:"Team Anu morning meetings"}
  ]
};

const latestRecurringMeetings={
  "2026-08-10":1,"2026-08-11":1,"2026-08-12":1,"2026-08-13":1,"2026-08-14":1,
  "2026-08-17":1,"2026-08-18":1,"2026-08-19":1,"2026-08-20":1,"2026-08-21":1,
  "2026-08-24":1,"2026-08-25":1,"2026-08-26":1,"2026-08-27":1,"2026-08-28":1,
  "2026-08-31":1,"2026-09-01":1,"2026-09-02":1,"2026-09-03":1,"2026-09-04":1,
  "2026-09-07":1,"2026-09-08":1,"2026-09-09":1,"2026-09-10":1,"2026-09-11":1,
  "2026-09-14":1,"2026-09-15":1,"2026-09-16":1,"2026-09-17":1,"2026-09-18":1,
  "2026-09-28":1,"2026-09-29":1,"2026-09-30":1,
  "2026-10-07":1,"2026-10-08":1,"2026-10-09":1,"2026-10-12":1,"2026-10-13":1,
  "2026-10-14":1,"2026-10-15":1,"2026-10-16":1,"2026-10-19":1,"2026-10-20":1,"2026-10-21":1
};
const duplicateReview={};
function recurringDetailsFor(date){
  const count=latestRecurringMeetings[date]||0;
  const already=(historicalDetails[date]||[]).some(x=>
    x.accountCode==="PS" &&
    x.type==="Meeting" &&
    Number(x.hours)===0.5 &&
    /anu|morning meeting/i.test(String(x.details||""))
  );
  if(already)return [];
  return Array.from({length:count},()=>({
    accountCode:"PS",type:"Meeting",hours:.5,details:"Team Anu morning meetings"
  }));
}

function saved(){try{return JSON.parse(localStorage.getItem("timeentry-entries")||"[]")}catch(_){return[]}}
function saveAll(data){localStorage.setItem("timeentry-entries",JSON.stringify(data))}
function restoreRequestedFour(){
  const params=new URLSearchParams(location.search);
  if(params.get("restore4")!=="1")return false;
  const restore=[
    {accountCode:"MAN",date:"2026-10-05",type:"Troubleshooting",hours:1,details:"Working with Jamal on updating devices time zone via mx config."},
    {accountCode:"RB",date:"2026-10-06",type:"Cadence Call",hours:1.5,details:"Prepping for cadence call an attending kids call with Customer, Nick and Mark."},
    {accountCode:"PS",date:"2026-10-06",type:"Other",hours:3.5,details:"Continue working on maturity model."},
    {accountCode:"PS",date:"2026-10-06",type:"Meeting",hours:1.5,details:"Meeting with Michael to discuss DoorDash"}
  ].map((x,i)=>({
    id:crypto.randomUUID?.()||String(Date.now()+i),
    timestamp:new Date().toISOString(),
    recoveredFromScreenshot:true,
    ...x
  }));
  saveAll(restore);
  localStorage.removeItem("timeentry-transfer-baseline");
  localStorage.setItem("timeentry-recovery-exact4","1");
  return true;
}
function ensureTransferBaseline(){
  if(localStorage.getItem("timeentry-transfer-baseline"))return;
  const stamp=new Date().toISOString();
  const data=saved().map(x=>({...x,transferredAt:x.transferredAt||stamp}));
  saveAll(data);
  localStorage.setItem("timeentry-transfer-baseline",stamp);
}
function pendingEntries(){return saved().filter(x=>!x.transferredAt)}
function markTransferred(ids){
  const set=new Set(ids);
  const stamp=new Date().toISOString();
  saveAll(saved().map(x=>set.has(x.id)?{...x,transferredAt:stamp}:x));
  ensureTransferBaseline();
renderHistory();
}
function todayISO(){const d=new Date(),off=d.getTimezoneOffset();return new Date(d.getTime()-off*60000).toISOString().slice(0,10)}
function latestHistoricalDate(){
  return Object.keys(historicalSubmitted).sort().pop()||todayISO();
}
function historyEndDate(){
  return [todayISO(),latestHistoricalDate()].sort().pop();
}
const ONTARIO_STAT_HOLIDAYS={
  "2026-09-07":"Labour Day",
  "2026-10-12":"Thanksgiving Day",
  "2026-12-25":"Christmas Day",
  "2026-12-28":"Boxing Day observed",
  "2027-01-01":"New Year's Day",
  "2027-02-15":"Family Day",
  "2027-03-26":"Good Friday",
  "2027-05-24":"Victoria Day",
  "2027-07-01":"Canada Day"
};
function statutoryHolidayName(date){return ONTARIO_STAT_HOLIDAYS[date]||""}
function holidaysInRange(start,end){
  return Object.entries(ONTARIO_STAT_HOLIDAYS)
    .filter(([date])=>date>=start&&date<=end)
    .sort((a,b)=>a[0].localeCompare(b[0]))
    .map(([date,name])=>({date,name}));
}
function holidayShortDate(date){
  const [y,m,d]=date.split("-").map(Number);
  return new Date(y,m-1,d).toLocaleDateString("en-CA",{month:"short",day:"numeric"});
}
function holidaySummaryText(start,end){
  const list=holidaysInRange(start,end);
  if(!list.length)return "0 Ontario statutory holidays";
  return list.length+" Ontario statutory holiday"+(list.length===1?"":"s")+": "+
    list.map(h=>h.name+" ("+holidayShortDate(h.date)+")").join(", ");
}
function isStatutoryHoliday(date){return !!statutoryHolidayName(date)}
function weekdaysBetween(start,end){
  const [sy,sm,sd]=start.split("-").map(Number);
  const [ey,em,ed]=end.split("-").map(Number);
  const cur=new Date(sy,sm-1,sd),last=new Date(ey,em-1,ed);
  const dates=[];
  while(cur<=last){
    const wd=cur.getDay();
    if(wd>=1&&wd<=5){
      const off=cur.getTimezoneOffset();
      dates.push(new Date(cur.getTime()-off*60000).toISOString().slice(0,10));
    }
    cur.setDate(cur.getDate()+1);
  }
  return dates;
}
function expectedHoursForRange(start,end,{respectVacation=true}={}){
  const vac=vacationDates();
  return weekdaysBetween(start,end).filter(d=>
    !isStatutoryHoliday(d) && (!respectVacation || !vac.has(d))
  ).length*7;
}
const QUARTERS=[
  {key:"Q1",label:"Q1",start:"2026-08-01",end:"2026-10-31",months:[
    {key:"2026-08",label:"August",start:"2026-08-01",end:"2026-08-31"},
    {key:"2026-09",label:"September",start:"2026-09-01",end:"2026-09-30"},
    {key:"2026-10",label:"October",start:"2026-10-01",end:"2026-10-31"}
  ]},
  {key:"Q2",label:"Q2",start:"2026-11-01",end:"2027-01-31",months:[
    {key:"2026-11",label:"November",start:"2026-11-01",end:"2026-11-30"},
    {key:"2026-12",label:"December",start:"2026-12-01",end:"2026-12-31"},
    {key:"2027-01",label:"January",start:"2027-01-01",end:"2027-01-31"}
  ]},
  {key:"Q3",label:"Q3",start:"2027-02-01",end:"2027-04-30",months:[
    {key:"2027-02",label:"February",start:"2027-02-01",end:"2027-02-28"},
    {key:"2027-03",label:"March",start:"2027-03-01",end:"2027-03-31"},
    {key:"2027-04",label:"April",start:"2027-04-01",end:"2027-04-30"}
  ]},
  {key:"Q4",label:"Q4",start:"2027-05-01",end:"2027-07-31",months:[
    {key:"2027-05",label:"May",start:"2027-05-01",end:"2027-05-31"},
    {key:"2027-06",label:"June",start:"2027-06-01",end:"2027-06-30"},
    {key:"2027-07",label:"July",start:"2027-07-01",end:"2027-07-31"}
  ]}
];
function quarterByKey(key){return QUARTERS.find(q=>q.key===key)||QUARTERS[0]}
function currentQuarter(){
  const ref=historyEndDate();
  return QUARTERS.find(q=>ref>=q.start&&ref<=q.end)||QUARTERS[0];
}
function rowsForQuarter(key){
  const q=quarterByKey(key);
  return historicalRows().filter(r=>r.date>=q.start&&r.date<=q.end);
}
function quarterSummary(key){
  const q=quarterByKey(key);
  const rows=rowsForQuarter(key);
  const expectedToDate=rows.filter(r=>!r.vacation&&!r.holiday).length*7;
  const fullExpected=expectedHoursForRange(q.start,q.end,{respectVacation:true});
  const logged=rows.reduce((n,r)=>n+r.submitted,0);
  const queued=rows.reduce((n,r)=>n+r.queued,0);
  const missing=rows.reduce((n,r)=>n+r.remaining,0);
  return {...q,expected:expectedToDate,fullExpected,logged,queued,missing};
}
function renderSplashQuarters(){
  const box=$("#splashQuarterSummary");
  if(!box)return;
  const current=currentQuarter().key;
  box.innerHTML=QUARTERS.map(q=>{
    const s=quarterSummary(q.key);
    const active=q.key===current;
    const hasRows=rowsForQuarter(q.key).length>0;
    const completionBase=hasRows?s.expected:s.fullExpected;
    const completionPct=completionBase>0?Math.min(100,Math.round((s.logged/completionBase)*100)):0;
    const holidays=holidaysInRange(q.start,q.end);
    const holidayNames=holidays.map(h=>h.name+' '+holidayShortDate(h.date)).join(' • ');
    return '<button type="button" class="quarter-card compact '+(active?'active':'')+'" data-quarter="'+q.key+'">'+
      '<div class="quarter-top">'+
        '<div><span class="quarter-name">'+q.label+'</span><span class="quarter-range">'+formatHistoryDate(q.start).replace(/^[A-Za-z]{3}, /,"")+' – '+formatHistoryDate(q.end).replace(/^[A-Za-z]{3}, /,"")+'</span></div>'+
        '<span class="quarter-completion '+(completionPct>=100?'complete':(completionPct>0?'progress':'empty'))+'" aria-label="'+completionPct+' percent complete">'+completionPct+'%</span>'+
      '</div>'+
      (hasRows
        ? '<div class="quarter-metric"><strong>'+s.logged.toFixed(1)+' <span>/ '+s.expected.toFixed(1)+' h</span></strong><b>'+s.missing.toFixed(1)+' h missing</b></div>'+
          '<div class="quarter-target">Target '+s.fullExpected.toFixed(1)+' h</div>'
        : '<div class="quarter-metric"><strong>'+s.fullExpected.toFixed(1)+' <span>h expected</span></strong><b>Upcoming</b></div>')+
      '<div class="quarter-holidays-compact"><span class="quarter-holiday-count">H '+holidays.length+'</span><span>'+holidayNames+'</span></div>'+
    '</button>';
  }).join("");
  box.querySelectorAll("[data-quarter]").forEach(b=>b.onclick=()=>{
    historicalQuarter=b.dataset.quarter;
    historicalMonth=null;
    historicalFilter="all";
    showOnly("historicalScreen");
    renderHistorical();
  });
}

function monthHistorySummary(){
  const q=quarterByKey(historicalQuarter||currentQuarter().key);
  const rows=historicalRows();
  return q.months.map(m=>{
    const effectiveEnd=[m.end,historyEndDate()].sort()[0];
    const monthRows=rows.filter(r=>r.date>=m.start&&r.date<=effectiveEnd);
    const expected=monthRows.filter(r=>!r.vacation&&!r.holiday).length*7;
    const logged=monthRows.reduce((n,r)=>n+r.submitted,0);
    const queued=monthRows.reduce((n,r)=>n+r.queued,0);
    const effective=logged+queued;
    const percent=expected>0?Math.min(100,Math.round((effective/expected)*100)):0;
    return {...m,end:effectiveEnd,expected,logged,queued,effective,percent,gap:Math.max(0,expected-effective)};
  });
}

function showOnly(id){["splashScreen","portfolioScreen","entryScreen","multiEntryScreen","historicalScreen","customerHoursScreen"].forEach(x=>$("#"+x)?.classList.add("hidden"));$("#"+id)?.classList.remove("hidden");window.scrollTo({top:0,behavior:"smooth"})}

function customerBadge(c){return '<span class="player-photo customer-avatar"><strong>'+c.short+'</strong></span>'}
function renderPortfolio(){
  $("#portfolioProgress").textContent=customers.length+" accounts";
  $("#customerGrid").innerHTML=customers.map(c=>`<button type="button" class="player-tile" data-id="${c.id}">${customerBadge(c)}<span class="jersey">ACCOUNT</span><strong>${c.short}</strong><span class="status-label">Tap to enter time</span></button>`).join("");
  $("#customerGrid").querySelectorAll(".player-tile").forEach(b=>b.onclick=()=>openCustomer(b.dataset.id));
  applyRosterLayout();
}
function openCustomer(id){
  editingId=null;
  activeCustomer=customers.find(c=>c.id===id);
  selectedHours=catchupContext
    ? (catchupContext.mode==="additional" ? 0.5 : Math.max(.5,Math.min(7,catchupContext.remaining)))
    : 1;
  $("#activeCustomerName").textContent=activeCustomer.short;
  $("#activeCustomerDetail").textContent=catchupContext
    ? (catchupContext.mode==="additional"
        ? "Historical additional time • "+formatHistoryDate(catchupContext.date)+" • already "+catchupContext.effective.toFixed(1)+" h"
        : "Historical catch-up • "+formatHistoryDate(catchupContext.date)+" • "+catchupContext.remaining.toFixed(1)+" h remaining")
    : "Customer code";
  $("#entryDate").value=catchupContext?.date||todayISO();
  $("#entryType").value="Meeting";
  $("#entryDetails").value="";
  $("#message").textContent="";
  $("#saveBtn").textContent="Save Time Entry";
  $("#saveNextBtn").classList.remove("hidden");
  renderHours();
  showOnly("entryScreen");
}
function showPortfolio(){activeCustomer=null;showOnly("portfolioScreen");renderPortfolio()}

function renderHours(){
  const values=[0.5,1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,8];
  $("#hoursGrid").innerHTML=values.map(v=>`<button type="button" class="hour-chip ${v===selectedHours?"active":""}" data-hours="${v}">${v} h</button>`).join("");
  $("#hoursGrid").querySelectorAll(".hour-chip").forEach(b=>b.onclick=()=>{selectedHours=Number(b.dataset.hours);renderHours()});
  $("#hoursValue").textContent=selectedHours.toFixed(1)+" h";
}
function changeHours(delta){selectedHours=Math.max(0.5,Math.min(24,Math.round((selectedHours+delta)*2)/2));renderHours()}

function buildEntry(){
 return {
   accountCode:activeCustomer.id,
   date:$("#entryDate").value||todayISO(),
   type:$("#entryType").value,
   hours:selectedHours,
   details:$("#entryDetails").value.trim()
 };
}
function showSaveConfirmation(text){
  $("#message").textContent=text;
  const toast=$("#saveToast");
  if(toast){
    toast.textContent=text;
    toast.classList.add("show");
    clearTimeout(showSaveConfirmation.timer);
    showSaveConfirmation.timer=setTimeout(()=>toast.classList.remove("show"),1800);
  }
}
function saveEntry(next){
  if(!activeCustomer||saveLocked)return;
  const entry=buildEntry();
  if(!entry.type){$("#message").textContent="Choose a Type.";return}
  if(!entry.details){$("#message").textContent="Add Details.";return}
  saveLocked=true;
  $("#saveBtn").disabled=true;
  $("#saveNextBtn").disabled=true;
  const data=saved();
  if(editingId){
    const i=data.findIndex(x=>x.id===editingId);
    if(i>=0)data[i]={...data[i],...entry,updatedAt:new Date().toISOString(),transferredAt:null};
  }else{
    data.push({id:crypto.randomUUID?.()||String(Date.now()),timestamp:new Date().toISOString(),...entry});
  }
  saveAll(data);
  renderHistory();
  showSaveConfirmation(editingId?"Updated ✓":"Saved ✓");
  const wasEditing=!!editingId;
  editingId=null;
  setTimeout(()=>{
    saveLocked=false;
    $("#saveBtn").disabled=false;
    $("#saveNextBtn").disabled=false;
    if(catchupContext){
      catchupContext=null;
      renderHistorical();
      showOnly("historicalScreen");
    }else if(next||wasEditing)showPortfolio();
  },650);
}
function renderHistory(){
 const data=saved(); $("#savedCount").textContent=data.length;
 const today=todayISO();
 const td=new Date(today+"T12:00:00");
 const day=(td.getDay()+6)%7;
 const monday=new Date(td); monday.setDate(td.getDate()-day);
 const sunday=new Date(monday); sunday.setDate(monday.getDate()+6);
 const iso=d=>{const off=d.getTimezoneOffset();return new Date(d.getTime()-off*60000).toISOString().slice(0,10)};
 const weekStart=iso(monday),weekEnd=iso(sunday);
 const sum=list=>list.reduce((n,x)=>n+(Number(x.hours)||0),0);
 const todayHours=sum(data.filter(x=>x.date===today));
 const weekHours=sum(data.filter(x=>x.date>=weekStart&&x.date<=weekEnd));
 const totalHours=sum(data);
 if($("#savedTodayHours"))$("#savedTodayHours").textContent=todayHours.toFixed(1);
 if($("#savedWeekHours"))$("#savedWeekHours").textContent=weekHours.toFixed(1);
 if($("#savedTotalHours"))$("#savedTotalHours").textContent=totalHours.toFixed(1);
 $("#historyList").innerHTML=data.length?data.slice().reverse().map(x=>`<div class="saved-row"><div class="saved-content"><strong>${x.accountCode}</strong><small>${x.date} • ${x.type} • ${Number(x.hours).toFixed(1)} h</small><span>${x.details}</span></div><div class="entry-controls"><button type="button" class="entry-edit" data-edit="${x.id}">Edit</button><button type="button" class="entry-delete" data-delete="${x.id}">Delete</button></div></div>`).join(""):"<p>No time entries saved yet.</p>";
 $("#historyList").querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editEntry(b.dataset.edit));
 $("#historyList").querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteEntry(b.dataset.delete));
 const queue=data.map(({accountCode,date,type,hours,details})=>({accountCode,date,type,hours,details}));
 $("#jsonPreview").textContent=JSON.stringify(queue,null,2);
}
function editEntry(id){
 const x=saved().find(e=>e.id===id); if(!x)return;
 editingId=id;
 activeCustomer=customers.find(c=>c.id===x.accountCode)||{id:x.accountCode,short:x.accountCode};
 selectedHours=Number(x.hours)||1;
 $("#activeCustomerName").textContent=x.accountCode;
 $("#activeCustomerDetail").textContent="Editing saved entry";
 $("#entryDate").value=x.date||todayISO();
 $("#entryType").value=x.type||"";
 $("#entryDetails").value=x.details||"";
 $("#saveBtn").textContent="Update Time Entry";
 $("#saveNextBtn").classList.add("hidden");
 $("#message").textContent="Editing saved entry";
 $("#history").classList.add("hidden");
 renderHours();
 showOnly("entryScreen");
}
function deleteEntry(id){
 const data=saved();
 const x=data.find(e=>e.id===id); if(!x)return;
 if(!confirm(`Delete this ${x.accountCode} entry? This cannot be undone.`))return;
 saveAll(data.filter(e=>e.id!==id));
 renderHistory();
 showSaveConfirmation("Entry deleted");
}
function buildTransferPackage(includeAll=false){
 const entries=includeAll?saved():pendingEntries();
 if(!entries.length)throw new Error(includeAll?"No saved entries to send":"No new entries to send");
 const payload=entries.map(({accountCode,date,type,hours,details})=>({accountCode,date,type,hours,details}));
 const url=location.origin+location.pathname.replace(/[^/]*$/,"")+"transfer.html#q="+encodeURIComponent(JSON.stringify(payload));
 return {url,ids:entries.map(x=>x.id),count:entries.length,includeAll};
}
function buildTransferUrl(){return buildTransferPackage(false).url}
function showTransferLink(url){
 const box=$("#transferLinkBox"),link=$("#transferLink");
 if(!box||!link)return;
 link.href=url;
 link.textContent=url;
 box.classList.remove("hidden");
}
async function sendToLaptop(){
 let pack;
 try{pack=buildTransferPackage()}catch(e){showSaveConfirmation(e.message);return}
 showTransferLink(pack.url);
 try{
   if(navigator.share){
     await navigator.share({title:"TimeEntry Transfer",text:"Open this link on your laptop to load the TimeEntry queue into the Chrome extension.",url:pack.url});
     markTransferred(pack.ids);
     showSaveConfirmation(pack.count+" new entr"+(pack.count===1?"y":"ies")+" shared");
     return;
   }
 }catch(err){
   if(err&&err.name==="AbortError")return;
 }
 try{
   await navigator.clipboard.writeText(pack.url);
   markTransferred(pack.ids);
   showSaveConfirmation(pack.count+" new entr"+(pack.count===1?"y":"ies")+" copied");
 }catch(_){
   showSaveConfirmation("Transfer link ready below");
 }
}
async function sendAllToLaptop(){
 let pack;
 try{pack=buildTransferPackage(true)}catch(e){showSaveConfirmation(e.message);return}
 if(!confirm("Send all "+pack.count+" saved entries, including entries that may have been transferred before?"))return;
 showTransferLink(pack.url);
 try{
   if(navigator.share){
     await navigator.share({title:"TimeEntry Transfer",text:"Open this link on your laptop to load ALL saved TimeEntry records into the Chrome extension.",url:pack.url});
     markTransferred(pack.ids);
     showSaveConfirmation(pack.count+" saved entries shared");
     return;
   }
 }catch(err){
   if(err&&err.name==="AbortError")return;
 }
 try{
   await navigator.clipboard.writeText(pack.url);
   markTransferred(pack.ids);
   showSaveConfirmation(pack.count+" saved entries copied");
 }catch(_){
   showSaveConfirmation("Transfer link ready below");
 }
}
async function copyJson(){
 const data=saved().map(({accountCode,date,type,hours,details})=>({accountCode,date,type,hours,details}));
 const text=JSON.stringify(data,null,2);
 try{await navigator.clipboard.writeText(text);alert("JSON queue copied.")}catch(_){prompt("Copy JSON queue:",text)}
}

function vacationDates(){
  try{
    const primary=JSON.parse(localStorage.getItem("timeentry-vacation-dates-v1")||"[]");
    const legacy=JSON.parse(localStorage.getItem("timeentry-vacation-dates")||"[]");
    return new Set([...(Array.isArray(primary)?primary:[]),...(Array.isArray(legacy)?legacy:[])]);
  }catch(_){return new Set()}
}
function saveVacationDates(set){
  const value=JSON.stringify([...set].sort());
  localStorage.setItem("timeentry-vacation-dates-v1",value);
  localStorage.setItem("timeentry-vacation-dates",value);
}
function isVacationDate(date){return vacationDates().has(date)}
function toggleVacationDate(date){
  const set=vacationDates();
  if(set.has(date))set.delete(date);else set.add(date);
  saveVacationDates(set);
  renderHistorical();
}
function monthWorkdays(monthKey){
  const [y,m]=monthKey.split("-").map(Number);
  const last=new Date(y,m,0).getDate();
  const out=[];
  for(let d=1;d<=last;d++){
    const dt=new Date(y,m-1,d);
    const wd=dt.getDay();
    if(wd>=1&&wd<=5){
      out.push(monthKey+"-"+String(d).padStart(2,"0"));
    }
  }
  return out;
}
function renderVacationCalendar(monthKey){
  vacationEditingMonth=monthKey;
  const all=vacationDates();
  const month=quarterByKey(historicalQuarter||currentQuarter().key).months.find(m=>m.key===monthKey);
  const label=month?.label||monthKey;
  $("#vacationModalTitle").textContent=label+" vacation days";
  const days=monthWorkdays(monthKey);
  $("#vacationCalendar").innerHTML=days.map(date=>{
    const [y,m,d]=date.split("-").map(Number);
    const dt=new Date(y,m-1,d);
    const dayName=dt.toLocaleDateString("en-CA",{weekday:"short"});
    const selected=all.has(date);
    return '<label class="vacation-day '+(selected?'selected':'')+'">'+
      '<input type="checkbox" value="'+date+'" '+(selected?'checked':'')+'>'+
      '<span><strong>'+dayName+'</strong><b>'+d+'</b></span>'+
    '</label>';
  }).join("");
  $("#vacationCalendar").querySelectorAll('input[type="checkbox"]').forEach(input=>{
    input.onchange=()=>input.closest(".vacation-day").classList.toggle("selected",input.checked);
  });
}
function openVacationPicker(monthKey){
  renderVacationCalendar(monthKey);
  $("#vacationModal").classList.remove("hidden");
}
function closeVacationPicker(){
  $("#vacationModal").classList.add("hidden");
  vacationEditingMonth=null;
}
function saveVacationMonth(){
  if(!vacationEditingMonth)return;
  const set=vacationDates();
  monthWorkdays(vacationEditingMonth).forEach(d=>set.delete(d));
  $("#vacationCalendar").querySelectorAll('input[type="checkbox"]:checked').forEach(x=>set.add(x.value));
  saveVacationDates(set);
  closeVacationPicker();
  renderHistorical();
  renderSplashQuarters();
}
function timeStatusKind(effective){
  const h=Number(effective)||0;
  return h<=0 ? "empty" : (h>=7 ? "complete" : "partial");
}
function timeStatusIcon(kind){
  return kind==="complete" ? "✓" : "!";
}
function timeStatusLabel(kind){
  return kind==="complete" ? "7+ HOURS" : (kind==="empty" ? "NO TIME" : "PARTIAL");
}
function formatHistoryDate(iso){
  const [y,m,d]=iso.split("-").map(Number);
  return new Date(y,m-1,d).toLocaleDateString("en-CA",{weekday:"short",month:"short",day:"numeric"});
}
function queuedByDate(){
  const out={};
  for(const x of pendingEntries()){
    if(!out[x.date])out[x.date]={hours:0,breakdown:{},entries:[]};
    out[x.date].hours+=Number(x.hours)||0;
    out[x.date].breakdown[x.accountCode]=(out[x.date].breakdown[x.accountCode]||0)+(Number(x.hours)||0);
    out[x.date].entries.push(x);
  }
  return out;
}
function historicalRows(){
  const queued=queuedByDate();
  const out=[];
  const [sy,sm,sd]=HISTORY_START.split("-").map(Number);
  const [ey,em,ed]=historyEndDate().split("-").map(Number);
  const cur=new Date(sy,sm-1,sd),last=new Date(ey,em-1,ed);

  while(cur<=last){
    const weekday=cur.getDay();
    if(weekday>=1&&weekday<=5){
      const off=cur.getTimezoneOffset();
      const date=new Date(cur.getTime()-off*60000).toISOString().slice(0,10);
      const base=historicalSubmitted[date]||{hours:0,breakdown:{}};
      const q=queued[date]||{hours:0,breakdown:{},entries:[]};
      const submitted=Number(base.hours)||0;
      const queuedHours=Number(q.hours)||0;
      const effective=submitted+queuedHours;
      const vacation=isVacationDate(date);
      const holiday=statutoryHolidayName(date);
      const remaining=(vacation||holiday)?0:Math.max(0,7-effective);
      const breakdown={...base.breakdown};
      for(const [code,hours] of Object.entries(q.breakdown||{})){
        breakdown[code]=(breakdown[code]||0)+hours;
      }
      out.push({
        date,submitted,queued:queuedHours,effective,remaining,breakdown,vacation,holiday,complete:vacation||!!holiday||effective>=7,
        submittedEntries:[...(historicalDetails[date]||[]),...recurringDetailsFor(date)],
        queuedEntries:q.entries||[]
      });
    }
    cur.setDate(cur.getDate()+1);
  }
  return out;
}
function customerPeriodOptions(){
  const q=quarterByKey(historicalQuarter||currentQuarter().key);
  return [
    {value:q.key,label:q.label+" • "+formatHistoryDate(q.start).replace(/^[A-Za-z]{3}, /,"")+" – "+formatHistoryDate(q.end).replace(/^[A-Za-z]{3}, /,""),start:q.start,end:q.end},
    ...q.months.map(m=>({value:m.key,label:m.label,start:m.start,end:[m.end,historyEndDate()].sort()[0]}))
  ];
}
function customerPeriodByValue(value){
  return customerPeriodOptions().find(x=>x.value===value)||customerPeriodOptions()[0];
}
function customerHoursForPeriod(periodValue){
  const p=customerPeriodByValue(periodValue);
  const rows=historicalRows().filter(r=>r.date>=p.start&&r.date<=p.end);
  const totals={};
  for(const r of rows){
    for(const [code,hours] of Object.entries(r.breakdown||{})){
      totals[code]=(totals[code]||0)+(Number(hours)||0);
    }
  }
  return {period:p,rows,totals};
}
function renderCustomerHours(periodValue){
  const select=$("#customerHoursPeriod");
  const options=customerPeriodOptions();
  if(!select.options.length || [...select.options].map(o=>o.value).join("|")!==options.map(o=>o.value).join("|")){
    select.innerHTML=options.map(o=>'<option value="'+o.value+'">'+o.label+'</option>').join("");
  }
  const chosen=periodValue||select.value||(historicalMonth||quarterByKey(historicalQuarter||currentQuarter().key).key);
  select.value=options.some(o=>o.value===chosen)?chosen:options[0].value;
  const data=customerHoursForPeriod(select.value);
  const entries=Object.entries(data.totals).sort((a,b)=>b[1]-a[1]);
  const total=entries.reduce((n,[,h])=>n+h,0);
  $("#customerHoursTotal").innerHTML=
    '<strong>'+total.toFixed(1)+' h</strong><span>logged across '+entries.length+' customer/account codes • '+data.period.label+'</span>';
  $("#customerHoursGrid").innerHTML=entries.length?entries.map(([code,hours])=>{
    const pct=total?Math.round((hours/total)*100):0;
    return '<button type="button" class="customer-hours-card" data-customer-code="'+code+'">'+
      '<div class="customer-hours-card-top"><strong>'+code+'</strong><span>'+hours.toFixed(1)+' h</span></div>'+
      '<div class="customer-hours-bar"><span style="width:'+pct+'%"></span></div>'+
      '<small>'+pct+'% of logged time</small>'+
    '</button>';
  }).join(""):'<p class="empty-history">No logged customer hours in this timeframe.</p>';
  $("#customerHoursGrid").querySelectorAll("[data-customer-code]").forEach(b=>b.onclick=()=>renderCustomerHoursDetail(b.dataset.customerCode,select.value));
  $("#customerHoursDetailCard").classList.add("hidden");
}
function renderCustomerHoursDetail(code,periodValue){
  const data=customerHoursForPeriod(periodValue);
  const rows=data.rows.filter(r=>Number(r.breakdown?.[code])>0);
  const total=rows.reduce((n,r)=>n+(Number(r.breakdown?.[code])||0),0);
  $("#customerHoursDetailTitle").textContent=code+" • "+total.toFixed(1)+" h";
  $("#customerHoursDetailPeriod").textContent=data.period.label;
  $("#customerHoursDetail").innerHTML=rows.map(r=>{
    const matching=[...(r.submittedEntries||[]),...(r.queuedEntries||[])].filter(x=>x.accountCode===code);
    const captured=matching.reduce((n,x)=>n+(Number(x.hours)||0),0);
    const actual=Number(r.breakdown?.[code])||0;
    const detail=matching.map(x=>
      '<div class="customer-hour-entry"><strong>'+x.type+' • '+Number(x.hours).toFixed(1)+' h</strong><p>'+x.details+'</p></div>'
    ).join("");
    const remainder=Math.max(0,actual-captured);
    return '<article class="customer-hour-day">'+
      '<div class="customer-hour-day-head"><strong>'+formatHistoryDate(r.date)+'</strong><span>'+actual.toFixed(1)+' h</span></div>'+
      detail+
      (remainder>0?'<div class="customer-hour-entry uncaptured"><strong>'+remainder.toFixed(1)+' h</strong><p>Details not yet captured from the Salesforce snapshot.</p></div>':'')+
    '</article>';
  }).join("")||'<p class="empty-history">No entries for this customer in the selected timeframe.</p>';
  $("#customerHoursDetailCard").classList.remove("hidden");
  $("#customerHoursDetailCard").scrollIntoView({behavior:"smooth",block:"start"});
}
function openCustomerHours(){
  showOnly("customerHoursScreen");
  renderCustomerHours(historicalMonth||quarterByKey(historicalQuarter||currentQuarter().key).key);
}
function renderHistorical(){
  const rows=historicalRows();
  const q=quarterByKey(historicalQuarter||currentQuarter().key);
  const visibleRows=rows.filter(r=>{
    if(r.date<q.start||r.date>q.end)return false;
    if(historicalMonth && !r.date.startsWith(historicalMonth))return false;
    if(historicalFilter==="all")return true;
    if(historicalFilter==="missing")return !r.complete;
    if(historicalFilter==="complete")return r.complete;
    if(historicalFilter==="duplicates")return !!duplicateReview[r.date];
    if(historicalFilter==="vacation")return r.vacation;
    if(historicalFilter==="holiday")return !!r.holiday;
    return true;
  });
  const quarterRows=rows.filter(r=>r.date>=q.start&&r.date<=q.end);
  const missingHours=quarterRows.reduce((sum,r)=>sum+r.remaining,0);
  const incomplete=quarterRows.filter(r=>!r.vacation&&!r.holiday&&!r.complete).length;
  const queuedHours=quarterRows.reduce((sum,r)=>sum+r.queued,0);
  $("#historicalMissingHours").textContent=missingHours.toFixed(1);
  $("#historicalIncompleteDays").textContent=String(incomplete);
  $("#historicalQueuedHours").textContent=queuedHours.toFixed(1);
  $("#historicalPeriodLabel").textContent=q.label+" • "+formatHistoryDate(q.start).replace(/^[A-Za-z]{3}, /,"")+" – "+formatHistoryDate(q.end).replace(/^[A-Za-z]{3}, /,"")+" • 7 HOURS MON–FRI • Salesforce snapshot: "+SALESFORCE_SNAPSHOT_RECORD_COUNT+" records";
  const monthSummary=monthHistorySummary();
  const monthBox=$("#historicalMonthSummary");
  if(monthBox){
    const totalExpected=monthSummary.reduce((n,m)=>n+m.expected,0);
    const totalLogged=monthSummary.reduce((n,m)=>n+m.logged,0);
    const totalQueued=monthSummary.reduce((n,m)=>n+m.queued,0);
    monthBox.innerHTML=
      '<div class="month-summary-total progress-total">'+
        '<div><strong>'+(totalLogged+totalQueued).toFixed(1)+' / '+totalExpected.toFixed(1)+' h</strong>'+
        '<span>'+q.label+' progress • '+totalLogged.toFixed(1)+' logged'+(totalQueued?' + '+totalQueued.toFixed(1)+' saved':'')+' • through '+formatHistoryDate([q.end,historyEndDate()].sort()[0])+'</span></div>'+
        '<b class="month-total-pct">'+(totalExpected>0?Math.min(100,Math.round(((totalLogged+totalQueued)/totalExpected)*100)):0)+'%</b>'+
        '<div class="month-progress-track" aria-hidden="true"><i style="width:'+(totalExpected>0?Math.min(100,((totalLogged+totalQueued)/totalExpected)*100):0)+'%"></i></div>'+
      '</div>'+
      monthSummary.map(m=>
        '<div class="month-summary-wrap '+(historicalMonth===m.key?'selected':'')+'">'+
          '<button type="button" class="month-summary-row month-summary-select" data-history-month="'+m.key+'">'+
            '<div><strong>'+m.label+'</strong><small>'+(m.end<historyEndDate()?'full month':'through '+formatHistoryDate(m.end))+'</small>'+
            (holidaysInRange(m.start,m.end).length?'<em class="month-holiday-note">'+holidaySummaryText(m.start,m.end)+'</em>':'')+
          '</div>'+
            '<div class="month-summary-progress">'+
              '<div class="month-summary-metrics">'+
                '<span><b>'+m.effective.toFixed(1)+'</b> / '+m.expected.toFixed(1)+' h</span>'+
                (m.queued?'<span class="month-saved"><b>+'+m.queued.toFixed(1)+'</b> saved</span>':'')+
                ((m.effective)>m.expected
                  ? '<span class="month-over"><b>✓ +'+(m.effective-m.expected).toFixed(1)+'</b> over</span>'
                  : (m.effective===m.expected
                    ? '<span class="month-good"><b>✓</b> complete</span>'
                    : '<span class="month-gap"><b>'+m.gap.toFixed(1)+'</b> gap</span>'))+
              '</div>'+
              '<div class="month-progress-line"><div class="month-progress-track"><i style="width:'+m.percent+'%"></i></div><b class="month-percent">'+m.percent+'%</b></div>'+
            '</div>'+
          '</button>'+
          '<button type="button" class="month-vacation-btn" data-vacation-month="'+m.key+'">🏖 Vacation days</button>'+
        '</div>'
      ).join("");
    monthBox.querySelectorAll("[data-history-month]").forEach(b=>b.onclick=()=>{
      historicalMonth=b.dataset.historyMonth;
      historicalFilter="all";
      renderHistorical();
      document.querySelector("#historicalMonthNav")?.scrollIntoView({behavior:"smooth",block:"nearest"});
    });
    monthBox.querySelectorAll("[data-vacation-month]").forEach(b=>b.onclick=e=>{
      e.stopPropagation();
      openVacationPicker(b.dataset.vacationMonth);
    });
  }

  const monthNav=$("#historicalMonthNav");
  if(monthNav){
    monthNav.classList.toggle("hidden",!historicalMonth);
    const keys=q.months.map(m=>m.key);
    const labels=Object.fromEntries(q.months.map(m=>[m.key,m.label]));
    const idx=historicalMonth?keys.indexOf(historicalMonth):-1;
    $("#historyMonthNavLabel").textContent=historicalMonth?labels[historicalMonth]+" 2026":"";
    $("#historyPrevMonthBtn").disabled=idx<=0;
    $("#historyNextMonthBtn").disabled=idx<0||idx>=keys.length-1;
  }
    $("#historicalFilters")?.querySelectorAll("[data-history-filter]").forEach(b=>b.classList.toggle("active",b.dataset.historyFilter===historicalFilter));

  $("#historicalList").innerHTML=visibleRows.length?visibleRows.map(r=>{
    const chips=Object.entries(r.breakdown)
      .filter(([,h])=>Number(h)>0)
      .map(([code,h])=>'<span class="history-chip">'+code+' '+Number(h).toFixed(1)+'</span>').join("");
    const dayStatusKind=r.holiday?"holiday":(r.vacation?"vacation":timeStatusKind(r.effective));
    const dayStatusIcon='<span class="time-status-icon '+dayStatusKind+'" aria-hidden="true">'+(r.holiday?"H":(r.vacation?"V":timeStatusIcon(dayStatusKind)))+'</span>';
    const status=r.holiday
      ? '<span class="history-status holiday">'+dayStatusIcon+'<span>'+r.holiday+' • excluded</span></span>'
      : (r.vacation
        ? '<span class="history-status vacation">'+dayStatusIcon+'<span>Vacation • excluded</span></span>'
        : (r.complete
        ? '<span class="history-status complete">'+dayStatusIcon+'<span>'+r.effective.toFixed(1)+' h'+(r.effective>7?' • +'+(r.effective-7).toFixed(1)+' over':'')+'</span></span>'
        : '<span class="history-status '+dayStatusKind+'">'+dayStatusIcon+'<span>'+r.remaining.toFixed(1)+' h missing</span></span>'));
    const queued=r.queued>0?'<small class="queued-note">'+r.queued.toFixed(1)+' h queued in Fast Entry</small>':"";
    const expanded=expandedHistoricalDays.has(r.date) || true;

    const submittedLines=r.submittedEntries.map(x=>
      '<div class="history-detail-row">'+
        '<div class="history-detail-main"><strong>'+x.accountCode+'</strong><span>'+x.type+' • '+Number(x.hours).toFixed(1)+' h</span></div>'+
        '<p>'+x.details+'</p>'+
      '</div>'
    ).join("");
    const represented={};
    r.submittedEntries.forEach(x=>represented[x.accountCode]=(represented[x.accountCode]||0)+(Number(x.hours)||0));
    const uncapturedLines=Object.entries(r.breakdown)
      .filter(([code,hours])=>(Number(hours)||0)>(represented[code]||0)+0.001)
      .map(([code,hours])=>{
        const missing=(Number(hours)||0)-(represented[code]||0);
        return '<div class="history-detail-row history-detail-uncaptured">'+
          '<div class="history-detail-main"><strong>'+code+'</strong><span>'+missing.toFixed(1)+' h</span></div>'+
          '<p>Details not yet captured from the Salesforce snapshot.</p>'+
        '</div>';
      }).join("");

    const queuedLines=r.queuedEntries.map(x=>
      '<div class="history-detail-row queued-detail">'+
        '<div class="history-detail-main"><strong>'+x.accountCode+'</strong><span>'+x.type+' • '+Number(x.hours).toFixed(1)+' h • QUEUED</span></div>'+
        '<p>'+x.details+'</p>'+
        '<button type="button" class="history-edit-queued" data-edit-queued="'+x.id+'">Edit queued entry</button>'+
      '</div>'
    ).join("");

    const duplicateNote=duplicateReview[r.date]
      ? '<div class="history-duplicate-warning">⚠ Duplicate review: '+duplicateReview[r.date]+'</div>'
      : "";
    const detailsContent=(submittedLines||uncapturedLines||queuedLines)
      ? (submittedLines+uncapturedLines+queuedLines+duplicateNote)
      : ('<p class="history-no-details">No submitted details for this date.</p>'+duplicateNote);

    return '<article class="history-day '+(r.holiday?"is-holiday":(r.vacation?"is-vacation":(r.complete?"is-complete":"is-missing")))+'">'+
      '<div class="history-day-top"><div class="history-date-with-icon">'+dayStatusIcon+'<div><strong>'+formatHistoryDate(r.date)+'</strong><small>'+r.submitted.toFixed(1)+' submitted • '+r.effective.toFixed(1)+' / 7.0 h including queue</small></div></div>'+status+'</div>'+
      '<div class="history-breakdown">'+(chips||'<span class="history-chip empty">No submitted time</span>')+'</div>'+
      queued+
      '<div class="history-details always-visible">'+detailsContent+'</div>'+
      (r.holiday
        ? '<div class="history-holiday-note">Ontario statutory holiday — no TAM hours expected.</div>'
        : (r.vacation
          ? '<button type="button" class="ghost history-vacation-toggle active" data-vacation-date="'+r.date+'">Remove Vacation Flag</button>'
          : ((!r.complete
            ? '<button type="button" class="primary history-add" data-history-date="'+r.date+'" data-history-remaining="'+r.remaining+'">Add Missing Time • '+r.remaining.toFixed(1)+' h</button>'
            : '<button type="button" class="ghost history-additional" data-history-date="'+r.date+'" data-history-effective="'+r.effective+'">Add Additional Time</button>')+
           '<button type="button" class="ghost history-vacation-toggle" data-vacation-date="'+r.date+'">Mark as Vacation</button>')))+
    '</article>';
  }).join(""):'<p class="empty-history">No days in this view.</p>';

  $("#historicalList")?.querySelectorAll(".history-add").forEach(b=>b.onclick=()=>{
    catchupContext={mode:"missing",date:b.dataset.historyDate,remaining:Number(b.dataset.historyRemaining)};
    showOnly("portfolioScreen");
    renderPortfolio();
  });
  $("#historicalList")?.querySelectorAll(".history-additional").forEach(b=>b.onclick=()=>{
    catchupContext={mode:"additional",date:b.dataset.historyDate,effective:Number(b.dataset.historyEffective)};
    showOnly("portfolioScreen");
    renderPortfolio();
  });
  $("#historicalList")?.querySelectorAll(".history-vacation-toggle").forEach(b=>b.onclick=()=>{
    toggleVacationDate(b.dataset.vacationDate);
  });
  $("#historicalList")?.querySelectorAll("[data-edit-queued]").forEach(b=>b.onclick=()=>{
    catchupContext=null;
    editEntry(b.dataset.editQueued);
  });
}
function openHistorical(){
  catchupContext=null;
  historicalQuarter=currentQuarter().key;
  historicalMonth=null;
  historicalFilter="all";
  renderHistorical();
  showOnly("historicalScreen");
}

function batchDateRange(){
  const start=HISTORY_START;
  const end=historyEndDate();
  const [sy,sm,sd]=start.split("-").map(Number);
  const [ey,em,ed]=end.split("-").map(Number);
  const cur=new Date(sy,sm-1,sd),last=new Date(ey,em-1,ed),out=[];
  while(cur<=last){
    const day=cur.getDay();
    if(day>=1&&day<=5){
      const off=cur.getTimezoneOffset();
      out.push(new Date(cur.getTime()-off*60000).toISOString().slice(0,10));
    }
    cur.setDate(cur.getDate()+1);
  }
  return out;
}
function currentMultiSelectedDates(){
  return [...($("#multiDateGrid")?.querySelectorAll('input[type="checkbox"]:checked')||[])].map(x=>x.value);
}
function renderMultiDates(selectedDates=[]){
  const selected=new Set(selectedDates);
  const rowsByDate=Object.fromEntries(historicalRows().map(r=>[r.date,r]));
  const dates=batchDateRange().filter(date=>{
    const r=rowsByDate[date];
    const statusKind=!r || r.effective===0 ? "empty" : (r.complete ? "complete" : "partial");
    return multiDateFilter==="all" || statusKind===multiDateFilter;
  });

  $("#multiDateGrid").innerHTML=dates.map(date=>{
    const r=rowsByDate[date];
    const statusKind=r?.holiday?"holiday":(r?.vacation?"vacation":timeStatusKind(r?.effective||0));
    const statusIcon=r?.holiday?"H":(r?.vacation?"V":timeStatusIcon(statusKind));
    const statusText=r?.holiday?"HOLIDAY":(r?.vacation?"VACATION":timeStatusLabel(statusKind));
    const meta=r
      ? (r.complete
          ? r.effective.toFixed(1)+" h logged"+(r.effective>7?" • +"+(r.effective-7).toFixed(1)+" over":"")
          : r.remaining.toFixed(1)+" h missing")
      : "7.0 h missing";

    const submitted=(r?.submittedEntries||[]).map(x=>
      '<div class="multi-existing-entry">'+
        '<div><strong>'+x.accountCode+'</strong><span>'+x.type+' • '+Number(x.hours).toFixed(1)+' h</span></div>'+
        '<p>'+x.details+'</p>'+
      '</div>'
    ).join("");

    const queued=(r?.queuedEntries||[]).map(x=>
      '<div class="multi-existing-entry queued">'+
        '<div><strong>'+x.accountCode+'</strong><span>'+x.type+' • '+Number(x.hours).toFixed(1)+' h • QUEUED</span></div>'+
        '<p>'+x.details+'</p>'+
      '</div>'
    ).join("");

    const entries=(submitted||queued)
      ? '<div class="multi-existing-list">'+submitted+queued+'</div>'
      : '<div class="multi-existing-empty">No recorded entry details for this date.</div>';

    return '<label class="multi-date-option '+statusKind+'">'+
      '<div class="multi-date-select-row">'+
        '<input type="checkbox" value="'+date+'" '+(selected.has(date)?"checked":"")+' '+((r?.vacation||r?.holiday)?"disabled":"")+'>'+
        '<span class="multi-date-status '+statusKind+'" aria-hidden="true">'+statusIcon+'</span>'+
        '<span class="multi-date-title"><strong>'+formatHistoryDate(date)+'</strong><small>'+meta+'</small></span>'+
        '<span class="multi-date-status-label '+statusKind+'">'+statusText+'</span>'+
      '</div>'+
      entries+
    '</label>';
  }).join("") || '<div class="multi-filter-empty">No dates match this filter.</div>';

  $("#multiDateFilters")?.querySelectorAll("[data-multi-filter]").forEach(b=>
    b.classList.toggle("active",b.dataset.multiFilter===multiDateFilter)
  );
}
function renderMultiCustomers(selected=[]){
  const set=new Set(selected);
  $("#multiCustomerGrid").innerHTML=customers.map(c=>
    '<label class="multi-customer-option">'+
      '<input type="checkbox" value="'+c.id+'" '+(set.has(c.id)?'checked':'')+'>'+
      '<span>'+c.short+'</span>'+
    '</label>'
  ).join("");
}
function selectedMultiCustomers(){
  if(!$("#multiCustomerMode").checked)return [$("#multiCustomer").value].filter(Boolean);
  return [...$("#multiCustomerGrid").querySelectorAll('input[type="checkbox"]:checked')].map(x=>x.value);
}
function openMultipleEntries(prefillIncomplete=false){
  catchupContext=null;
  multiDateFilter="all";
  $("#multiCustomer").innerHTML=customers.map(c=>'<option value="'+c.id+'">'+c.short+'</option>').join("");
  $("#multiType").innerHTML=types.map(t=>'<option value="'+t+'">'+t+'</option>').join("");
  $("#multiCustomerMode").checked=false;
  $("#multiCustomer").classList.remove("hidden");
  $("#multiCustomerGrid").classList.add("hidden");
  renderMultiCustomers(["PS"]);
  $("#multiCustomer").value="PS";
  $("#multiType").value="Meeting";
  $("#multiHours").value="0.5";
  $("#multiDetails").value="";
  $("#multiMessage").textContent="";
  const dates=prefillIncomplete?historicalRows().filter(r=>!r.complete).map(r=>r.date):[];
  renderMultiDates(dates);
  showOnly("multiEntryScreen");
}
function saveMultipleEntries(){
  const accountCodes=selectedMultiCustomers();
  const type=$("#multiType").value;
  const hours=Number($("#multiHours").value);
  const details=$("#multiDetails").value.trim();
  const dates=[...$("#multiDateGrid").querySelectorAll('input[type="checkbox"]:checked')].map(x=>x.value).filter(d=>!isVacationDate(d)&&!isStatutoryHoliday(d));

  if(!accountCodes.length){$("#multiMessage").textContent="Choose at least one customer.";return}
  if(!type){$("#multiMessage").textContent="Choose a type.";return}
  if(!details){$("#multiMessage").textContent="Add details.";return}
  if(!dates.length){$("#multiMessage").textContent="Select at least one date.";return}

  const data=saved();
  let added=0,skipped=0;
  for(const date of dates){
    for(const accountCode of accountCodes){
      const duplicate=data.some(x=>
        x.accountCode===accountCode &&
        x.date===date &&
        x.type===type &&
        Number(x.hours)===hours &&
        String(x.details||"").trim().toLowerCase()===details.toLowerCase()
      );
      if(duplicate){skipped++;continue}
      data.push({
        id:crypto.randomUUID?.()||String(Date.now()+added),
        timestamp:new Date().toISOString(),
        batchCreated:true,
        accountCode,date,type,hours,details
      });
      added++;
    }
  }
  saveAll(data);
  renderHistory();
  renderHistorical();
  $("#multiMessage").textContent=added+" entr"+(added===1?"y":"ies")+" added to Saved"+(skipped?" • "+skipped+" duplicate"+(skipped===1?"":"s")+" skipped":"")+" ✓";
  showSaveConfirmation(added+" entr"+(added===1?"y":"ies")+" added to Saved ✓");
}

function applyRosterLayout(){
 const mode=localStorage.getItem("timeentry-layout")==="wheel"?"wheel":"grid",grid=$("#customerGrid"),toggle=$("#layoutToggle");
 toggle?.querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.layout===mode));
 if(!grid)return;
 grid.classList.toggle("wheel-layout",mode==="wheel");
 if(mode==="wheel")setupRadialWheel();else{
   wheelMoved=false;
   wheelDragging=false;
   grid.classList.remove("wheel-active","wheel-left");
   grid.style.removeProperty("--wheel-angle");
 }
}
function setupRadialWheel(){
 const grid=$("#customerGrid"); if(!grid)return;
 grid.classList.toggle("wheel-left",(localStorage.getItem("timeentry-wheel-hand")||"right")==="left");
 grid.style.setProperty("--wheel-angle",wheelAngle+"deg");
 let hub=$("#wheelHub");
 if(!hub){hub=document.createElement("button");hub.type="button";hub.id="wheelHub";hub.className="wheel-hub";hub.innerHTML='<span class="hub-mark">TE</span><strong>Customers</strong><small>Tap to spin</small>';grid.appendChild(hub)}
 let throttle=$("#wheelThrottle");
 if(!throttle){throttle=document.createElement("div");throttle.id="wheelThrottle";throttle.className="wheel-throttle";throttle.innerHTML='<span class="throttle-arrow">▲</span><span class="throttle-fast">FASTER</span><div class="throttle-track"><span class="throttle-knob"></span><span class="throttle-zero"></span></div><span class="throttle-fast">FASTER</span><span class="throttle-arrow">▼</span>';grid.appendChild(throttle)}
 let hand=$("#wheelHand");
 if(!hand){hand=document.createElement("button");hand.type="button";hand.id="wheelHand";hand.className="wheel-hand";grid.appendChild(hand)}
 const handMode=localStorage.getItem("timeentry-wheel-hand")||"right";
 hand.textContent=handMode==="right"?"Right hand →":"← Left hand";
 hand.onclick=e=>{e.stopPropagation();localStorage.setItem("timeentry-wheel-hand",handMode==="right"?"left":"right");setupRadialWheel()};
 hub.onclick=e=>{e.preventDefault();e.stopPropagation();wheelActive=!wheelActive;grid.classList.toggle("wheel-active",wheelActive);hub.querySelector("small").textContent=wheelActive?"ACTIVE • spin":"Tap to spin"};
 grid.querySelectorAll(".player-tile").forEach((b,i)=>{b.style.setProperty("--i",i);b.style.setProperty("--n",customers.length)});
 if(throttle&&!throttle.dataset.bound){
   throttle.dataset.bound="1";
   const knob=throttle.querySelector(".throttle-knob"),track=throttle.querySelector(".throttle-track");
   let raf=0,targetSpeed=0,currentSpeed=0,last=0,drag=false;
   const applySpeedFX=()=>{
     const mag=Math.min(1,Math.abs(currentSpeed)/2.15);
     grid.style.setProperty("--speed-intensity",mag.toFixed(3));
     grid.classList.toggle("speed-low",mag>.08&&mag<=.38);
     grid.classList.toggle("speed-med",mag>.38&&mag<=.72);
     grid.classList.toggle("speed-high",mag>.72);
     grid.classList.toggle("spin-forward",currentSpeed>0.02);
     grid.classList.toggle("spin-reverse",currentSpeed<-.02);
   };
   const startLoop=()=>{
     if(raf)return;
     last=performance.now();
     const tick=t=>{
       const dt=Math.min(32,t-last);last=t;
       currentSpeed+=(targetSpeed-currentSpeed)*.14;
       if(!drag&&Math.abs(targetSpeed)<.001)currentSpeed*=.965;
       if(Math.abs(currentSpeed)>.006){
         wheelAngle+=currentSpeed*dt*.13;
         grid.style.setProperty("--wheel-angle",wheelAngle+"deg");
       }
       applySpeedFX();
       if(!drag&&Math.abs(targetSpeed)<.001&&Math.abs(currentSpeed)<.01){
         currentSpeed=0;
         applySpeedFX();
         grid.classList.remove("speed-low","speed-med","speed-high","spin-forward","spin-reverse");
         grid.style.setProperty("--speed-intensity","0");
         raf=0;
         return;
       }
       raf=requestAnimationFrame(tick);
     };
     raf=requestAnimationFrame(tick);
   };
   const paint=y=>{
     const r=track.getBoundingClientRect(),mid=r.top+r.height/2,half=r.height/2-12;
     const off=Math.max(-half,Math.min(half,y-mid));
     knob.style.transform="translate(-50%,"+off+"px)";
     const signed=(-off/half);
     targetSpeed=signed*2.15*(grid.classList.contains("wheel-left")?-1:1);
     startLoop();
   };
   const stop=()=>{
     drag=false;
     targetSpeed=0;
     knob.style.transform="translate(-50%,0px)";
     startLoop();
   };
   throttle.addEventListener("pointerdown",e=>{drag=true;throttle.setPointerCapture?.(e.pointerId);paint(e.clientY);e.preventDefault();e.stopPropagation()},{passive:false});
   throttle.addEventListener("pointermove",e=>{if(!drag)return;paint(e.clientY);e.preventDefault();e.stopPropagation()},{passive:false});
   throttle.addEventListener("pointerup",stop); throttle.addEventListener("pointercancel",stop);
 }
 if(!grid.dataset.wheelBound){
   grid.dataset.wheelBound="1";
   grid.addEventListener("pointerdown",e=>{if(!wheelActive||e.target.closest("#wheelHub,#wheelHand,#wheelThrottle"))return;wheelDragging=true;wheelMoved=false;wheelStartY=e.clientY;wheelStartAngle=wheelAngle;grid.setPointerCapture?.(e.pointerId);e.preventDefault()},{passive:false});
   grid.addEventListener("pointermove",e=>{if(!wheelDragging)return;const dy=e.clientY-wheelStartY;if(Math.abs(dy)>7)wheelMoved=true;wheelAngle=wheelStartAngle+dy*.38*(grid.classList.contains("wheel-left")?-1:1);grid.style.setProperty("--wheel-angle",wheelAngle+"deg");e.preventDefault()},{passive:false});
   const stop=e=>{if(!wheelDragging)return;wheelDragging=false;try{grid.releasePointerCapture?.(e.pointerId)}catch(_){}};
   grid.addEventListener("pointerup",stop);grid.addEventListener("pointercancel",stop);
   grid.addEventListener("click",e=>{
     if(grid.classList.contains("wheel-layout")&&wheelMoved){
       e.preventDefault();
       e.stopPropagation();
       wheelMoved=false;
     }
   },true);
 }
}

$("#entryType").innerHTML='<option value="">--None--</option>'+types.map(t=>'<option>'+t+'</option>').join("");
renderSplashQuarters();
function openQuarterlyDashboard(){
  historicalQuarter=null;
  historicalMonth=null;
  historicalFilter="all";
  renderSplashQuarters();
  showOnly("splashScreen");
}
$("#quarterlyNavBtn").onclick=openQuarterlyDashboard;
$("#brandHomeBtn").onclick=openQuarterlyDashboard;
$("#enterAppBtn").onclick=()=>{showOnly("portfolioScreen");renderPortfolio()};
$("#multipleEntriesBtn").onclick=()=>openMultipleEntries(false);
$("#multiNavBtn").onclick=()=>openMultipleEntries(false);
$("#historicalCustomerBtn").onclick=openCustomerHours;
$("#customerHoursBackBtn").onclick=()=>{showOnly("historicalScreen");renderHistorical()};
$("#customerHoursPeriod").onchange=()=>renderCustomerHours($("#customerHoursPeriod").value);
$("#customerHoursDetailClose").onclick=()=>$("#customerHoursDetailCard").classList.add("hidden");
$("#vacationModalClose").onclick=closeVacationPicker;
$("#vacationSaveBtn").onclick=saveVacationMonth;
$("#vacationClearMonthBtn").onclick=()=>{
  $("#vacationCalendar").querySelectorAll('input[type="checkbox"]').forEach(x=>{
    x.checked=false;
    x.closest(".vacation-day").classList.remove("selected");
  });
};
$("#vacationModal").onclick=e=>{if(e.target.id==="vacationModal")closeVacationPicker()};
$("#historicalMultipleBtn").onclick=()=>openMultipleEntries(true);
$("#multiBackBtn").onclick=()=>{showOnly("portfolioScreen");renderPortfolio()};
$("#multiSelectWeekdaysBtn").onclick=()=>renderMultiDates(historicalRows().filter(r=>!r.vacation&&!r.holiday&&!r.complete).map(r=>r.date));
$("#multiDateFilters").onclick=e=>{
  const b=e.target.closest("[data-multi-filter]");
  if(!b)return;
  const selected=currentMultiSelectedDates();
  multiDateFilter=b.dataset.multiFilter;
  renderMultiDates(selected);
};
$("#multiCustomerMode").onchange=()=>{
  const many=$("#multiCustomerMode").checked;
  $("#multiCustomer").classList.toggle("hidden",many);
  $("#multiCustomerGrid").classList.toggle("hidden",!many);
};
$("#multiSaveBtn").onclick=saveMultipleEntries;
$("#fastEntryNavBtn").onclick=()=>{catchupContext=null;showOnly("portfolioScreen");renderPortfolio()};
$("#historicalNavBtn").onclick=openHistorical;
$("#historicalBackBtn").onclick=()=>{catchupContext=null;showOnly("portfolioScreen");renderPortfolio()};
$("#historyPrevMonthBtn").onclick=()=>{
  const keys=["2026-08","2026-09","2026-10"],i=keys.indexOf(historicalMonth);
  if(i>0){historicalMonth=keys[i-1];historicalFilter="all";renderHistorical()}
};
$("#historyNextMonthBtn").onclick=()=>{
  const keys=["2026-08","2026-09","2026-10"],i=keys.indexOf(historicalMonth);
  if(i>=0&&i<keys.length-1){historicalMonth=keys[i+1];historicalFilter="all";renderHistorical()}
};
$("#historyAllMonthsBtn").onclick=()=>{historicalMonth=null;historicalFilter="all";renderHistorical()};
$("#historicalFilters").onclick=e=>{const b=e.target.closest("[data-history-filter]");if(!b)return;historicalFilter=b.dataset.historyFilter;renderHistorical()};
$("#backBtn").onclick=showPortfolio;
$("#hoursMinus").onclick=()=>changeHours(-0.5);
$("#hoursPlus").onclick=()=>changeHours(0.5);
$("#saveBtn").onclick=()=>saveEntry(false);
$("#saveNextBtn").onclick=()=>saveEntry(true);
$("#historyBtn").onclick=()=>{$("#history").classList.remove("hidden");renderHistory();$("#history").scrollIntoView({behavior:"smooth"})};
$("#closeHistoryBtn").onclick=()=>$("#history").classList.add("hidden");
$("#sendLaptopBtn").onclick=sendToLaptop;
$("#sendAllLaptopBtn").onclick=sendAllToLaptop;
$("#copyTransferLinkBtn").onclick=async()=>{try{const pack=buildTransferPackage();showTransferLink(pack.url);await navigator.clipboard.writeText(pack.url);markTransferred(pack.ids);showSaveConfirmation(pack.count+" new entr"+(pack.count===1?"y":"ies")+" copied")}catch(e){showSaveConfirmation(e.message)}};
$("#copyJsonBtn").onclick=copyJson;
$("#clearHistoryBtn").onclick=()=>{if(confirm("Clear all saved time entries?")){saveAll([]);renderHistory()}};
$("#layoutToggle").onclick=e=>{const b=e.target.closest("button[data-layout]");if(!b)return;localStorage.setItem("timeentry-layout",b.dataset.layout);applyRosterLayout()};
restoreRequestedFour();
renderHistory();