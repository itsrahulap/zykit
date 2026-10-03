// Sample headers for the "Load a sample" menu and the tests. Sender domains and IPs are
// reserved example values (RFC 2606 / RFC 5737); the receiving servers mimic Gmail and Microsoft 365.

export const GMAIL_SAMPLE = `Delivered-To: alice@gmail.com
Received: by 2002:a05:6a10:9e8c:b0:5a1:1c2:4f1 with SMTP id hu12csp1234567pxb;
        Tue, 1 Oct 2024 08:15:32 -0700 (PDT)
X-Received: by 2002:a05:620a:4410:b0:7a9:b8e5:1d2 with SMTP id v16mr1234567qkp.12.1727795732123;
        Tue, 01 Oct 2024 08:15:32 -0700 (PDT)
ARC-Seal: i=1; a=rsa-sha256; t=1727795732; cv=none;
        d=google.com; s=arc-20240605;
        b=Qm9ndXNTZWFsVmFsdWVGb3JUZXN0aW5n
ARC-Message-Signature: i=1; a=rsa-sha256; c=relaxed/relaxed; d=google.com; s=arc-20240605;
        h=to:subject:message-id:date:from:mime-version:dkim-signature;
        bh=47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=; b=Qm9ndXNTaWduYXR1cmU=
ARC-Authentication-Results: i=1; mx.google.com;
       dkim=pass header.i=@shop.example.com header.s=s2024 header.b=AbCdEf12;
       spf=pass (google.com: domain of orders@shop.example.com designates 203.0.113.45 as permitted sender) smtp.mailfrom=orders@shop.example.com;
       dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=shop.example.com
Return-Path: <orders@shop.example.com>
Received: from mail-out.shop.example.com (mail-out.shop.example.com. [203.0.113.45])
        by mx.google.com with ESMTPS id d75a77b69052e-45d2c1a1b2esi12345671cf.123.2024.10.01.08.15.31
        for <alice@gmail.com>
        (version=TLS1_3 cipher=TLS_AES_256_GCM_SHA384 bits=256/256);
        Tue, 01 Oct 2024 08:15:31 -0700 (PDT)
Received-SPF: pass (google.com: domain of orders@shop.example.com designates 203.0.113.45 as permitted sender) client-ip=203.0.113.45;
Authentication-Results: mx.google.com;
       dkim=pass header.i=@shop.example.com header.s=s2024 header.b=AbCdEf12;
       spf=pass (google.com: domain of orders@shop.example.com designates 203.0.113.45 as permitted sender) smtp.mailfrom=orders@shop.example.com;
       dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=shop.example.com
Received: from app-7.internal.shop.example.com (app-7.internal.shop.example.com [10.20.30.7])
\tby mail-out.shop.example.com (Postfix) with ESMTPSA id 4XJ1Zq3kQyz5c
\tfor <alice@gmail.com>; Tue,  1 Oct 2024 15:15:29 +0000 (UTC)
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=shop.example.com;
\ts=s2024; t=1727795729;
\tbh=47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=;
\th=Date:From:To:Subject:From;
\tb=AbCdEf12SignatureValue
Date: Tue, 01 Oct 2024 15:15:29 +0000
From: =?UTF-8?Q?Example_Shop_=E2=80=94_Orders?= <orders@shop.example.com>
To: alice@gmail.com
Message-ID: <20241001151529.4XJ1Zq3kQyz5c@shop.example.com>
Subject: =?UTF-8?B?WW91ciBvcmRlciAjMTA0MiBoYXMgc2hpcHBlZCDwn5qa?=
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8
List-Unsubscribe: <https://shop.example.com/unsubscribe?u=42>, <mailto:unsubscribe@shop.example.com>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
`;

export const OUTLOOK_SAMPLE = `Received: from DM6PR11MB4593.namprd11.prod.outlook.com (2603:10b6:5:2a1::12) by
 SA1PR11MB8256.namprd11.prod.outlook.com with HTTPS; Wed, 2 Oct 2024 14:03:12
 +0000
Received: from BN9PR03CA0412.namprd03.prod.outlook.com (2603:10b6:408:111::27)
 by DM6PR11MB4593.namprd11.prod.outlook.com (2603:10b6:5:2a1::12) with
 Microsoft SMTP Server (version=TLS1_2,
 cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id 15.20.8005.26; Wed, 2 Oct
 2024 14:03:11 +0000
Received: from BN2PEPF000044A8.namprd04.prod.outlook.com
 (2603:10b6:408:111:cafe::4c) by BN9PR03CA0412.outlook.office365.com
 (2603:10b6:408:111::27) with Microsoft SMTP Server (version=TLS1_2,
 cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id 15.20.8005.26 via Frontend
 Transport; Wed, 2 Oct 2024 14:03:11 +0000
Authentication-Results: spf=pass (sender IP is 198.51.100.25)
 smtp.mailfrom=mail.contoso.example; dkim=pass (signature was verified)
 header.d=contoso.example;dmarc=pass action=none
 header.from=contoso.example;compauth=pass reason=100
Received-SPF: Pass (protection.outlook.com: domain of mail.contoso.example
 designates 198.51.100.25 as permitted sender)
 receiver=protection.outlook.com; client-ip=198.51.100.25;
 helo=smtp.contoso.example; pr=C
Received: from smtp.contoso.example (198.51.100.25) by
 BN2PEPF000044A8.mail.protection.outlook.com (10.167.243.102) with Microsoft
 SMTP Server (version=TLS1_3, cipher=TLS_AES_256_GCM_SHA384) id 15.20.8026.11
 via Frontend Transport; Wed, 2 Oct 2024 14:03:10 +0000
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=contoso.example; s=selector1;
 h=From:Date:Subject:Message-ID:Content-Type:MIME-Version;
 bh=frcCV1k9oG9oKj3dpUqdJg1PxRT2RSN/XKdLCPjaYaY=; b=c2lnbmF0dXJl
From: Megan Bowen <megan.bowen@contoso.example>
To: Alex Wilber <alex.wilber@fabrikam.example>
Subject: Q4 planning notes
Thread-Topic: Q4 planning notes
Date: Wed, 2 Oct 2024 14:03:05 +0000
Message-ID: <BY5PR11MB4182F1A2B3C4D5E6F7A8B9C0D1E2@BY5PR11MB4182.namprd11.prod.outlook.com>
Content-Language: en-US
X-MS-Has-Attach:
X-MS-Exchange-Organization-SCL: 1
X-Mailer: Microsoft Outlook 16.0
MIME-Version: 1.0
`;

export const SPOOFED_SAMPLE = `Return-Path: <bounce-77812@bulk-mailer.example.net>
Received: from mx1.mail.example.org (mx1.mail.example.org [192.0.2.10])
        by inbox.mail.example.org with LMTP id kQ2bH0Yp/2Y3AQAA
        for <victim@mail.example.org>; Thu, 3 Oct 2024 09:12:40 +0000
Authentication-Results: mx1.mail.example.org;
        spf=softfail (mx1.mail.example.org: domain of transitioning bounce-77812@bulk-mailer.example.net does not designate 198.51.100.77 as permitted sender) smtp.mailfrom=bounce-77812@bulk-mailer.example.net;
        dkim=none;
        dmarc=fail (p=QUARANTINE sp=QUARANTINE dis=QUARANTINE) header.from=examplebank.com
Received: from vps-4411.hosting.example.net (unknown [198.51.100.77])
        by mx1.mail.example.org (Postfix) with ESMTP id 4XK2Lm0Rz9z1
        for <victim@mail.example.org>; Thu, 3 Oct 2024 09:12:39 +0000 (UTC)
Authentication-Results: examplebank.com; spf=pass smtp.mailfrom=examplebank.com; dkim=pass header.d=examplebank.com; dmarc=pass header.from=examplebank.com
Received: from localhost (localhost [127.0.0.1])
        by vps-4411.hosting.example.net with SMTP id a1b2c3;
        Thu, 3 Oct 2024 09:31:02 +0000
From: "Example Bank <security@examplebank.com>" <noreply@examplebank.com>
Reply-To: "Example Bank Support" <verify-team@account-check.example.net>
To: victim@mail.example.org
Subject: =?utf-8?Q?Urgent:_your_account_will_be_suspended?=
Date: Thu, 3 Oct 2024 09:31:00 +0000
Message-ID: <5f9c0b1e3a2d@vps-4411.hosting.example.net>
X-Mailer: PHPMailer 5.2.0 (https://github.com/PHPMailer/PHPMailer)
MIME-Version: 1.0
Content-Type: text/html; charset=utf-8
`;

export const SAMPLES = [
  { value: 'gmail', label: 'Gmail (legitimate)', text: GMAIL_SAMPLE },
  { value: 'outlook', label: 'Microsoft 365 / Outlook', text: OUTLOOK_SAMPLE },
  { value: 'spoofed', label: 'Spoofed phishing email', text: SPOOFED_SAMPLE },
] as const;
