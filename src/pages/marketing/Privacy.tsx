import Navbar from "@/components/marketing/Navbar";
import { useEffect } from "react";

const Privacy = () => {
  useEffect(() => {
    document.title = "Privacy Policy - Socratica";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <article className="container mx-auto px-6 py-16 max-w-4xl prose prose-slate dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: November 24, 2025</p>

        <h2>Introduction</h2>
        <p>
          Socratica ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our educational platform.
        </p>

        <h2>Information We Collect</h2>
        <h3>Information You Provide</h3>
        <ul>
          <li>Account information (name, email address, role)</li>
          <li>Course content and materials uploaded by teachers</li>
          <li>Student questions and tutor interactions</li>
          <li>Assignment submissions and responses</li>
        </ul>

        <h3>Automatically Collected Information</h3>
        <ul>
          <li>Usage data and analytics</li>
          <li>Device information and IP addresses</li>
          <li>Cookies and similar tracking technologies</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide and maintain our educational services</li>
          <li>Generate AI-powered tutoring responses</li>
          <li>Analyze learning patterns and provide insights to teachers</li>
          <li>Improve our platform and develop new features</li>
          <li>Communicate with you about your account and services</li>
          <li>Ensure platform security and prevent fraud</li>
        </ul>

        <h2>Information Sharing and Disclosure</h2>
        <p>We do not sell your personal information. We may share information:</p>
        <ul>
          <li>Within your educational institution (between teachers and enrolled students)</li>
          <li>With service providers who assist in operating our platform</li>
          <li>When required by law or to protect rights and safety</li>
          <li>In connection with a business transfer or acquisition</li>
        </ul>

        <h2>Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
        </p>

        <h2>Student Privacy</h2>
        <p>
          We are committed to protecting student privacy and comply with applicable education privacy laws, including FERPA. Student data is only accessible to authorized teachers within their courses.
        </p>

        <h2>Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access and receive a copy of your personal information</li>
          <li>Correct inaccurate or incomplete information</li>
          <li>Request deletion of your information</li>
          <li>Opt out of certain data processing activities</li>
          <li>Withdraw consent where processing is based on consent</li>
        </ul>

        <h2>Children's Privacy</h2>
        <p>
          Our service is intended for educational institutions. We do not knowingly collect information from children under 13 without verified parental or school consent as required by COPPA.
        </p>

        <h2>Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy, please contact us at:{" "}
          <a href="mailto:privacy@socratica.app">privacy@socratica.app</a>
        </p>
      </article>

      <footer className="border-t bg-muted/30 mt-20">
        <div className="container mx-auto px-6 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Socratica. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
