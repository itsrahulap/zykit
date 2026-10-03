import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste one or more Kubernetes manifests (separate them with `---`), drop a file on the box, or use **Open file**. **Example** loads a sample with several problems.',
    'Read the **Resources** table for what was found: kind, name, namespace and key details such as replicas, ports or the cron schedule.',
    'Go through the **Findings**. Each one has a severity (error, warning or tip), an explanation and, where there is a standard fix, a snippet you can copy. Use the filter to show only errors or warnings.',
    'Fix the manifest and the results update as you type.',
  ],
  howItWorks:
    'The text is parsed with the `yaml` package as a multi-document stream (alias expansion is capped at 100 to refuse "billion laughs" input). Each document is read as a Kubernetes object, `kind: List` items are unpacked, and the checker looks at three things.\n\n' +
    'Structure: `apiVersion`, `kind` and `metadata.name` exist; the apiVersion fits the kind and has not been removed (`extensions/v1beta1`, `apps/v1beta1`, `batch/v1beta1`, `policy/v1beta1`, `autoscaling/v2beta1` and similar); a workload selector matches its pod template labels; a Service selector matches a workload in the paste and each `targetPort` matches a containerPort (by number or name); Ingress backends point at a Service in the paste with that port; HPA, PodDisruptionBudget and role bindings point at things that exist.\n\n' +
    'Best practice: missing resource requests and limits, `:latest` or untagged images, missing readiness and liveness probes, containers that may run as root, allow privilege escalation, are privileged, have a writable root filesystem or keep default capabilities, `hostNetwork`, `hostPID`, `hostPath` and `hostPort`, passwords in plain env values, Secrets whose values sit in the manifest (a masked, decoded preview is shown), single-replica Deployments, workloads without a PodDisruptionBudget and wildcard RBAC rules. CronJob schedules are parsed with the Cron Builder parser and explained in words.',
  limits: [
    'Input is limited to about 1 MB and 300 documents. Alias expansion above 100 is rejected.',
    'It is a static linter for the common built-in kinds. Custom resources are listed but only their basic structure is checked, and field names are not validated against the full OpenAPI schema.',
    'Cross-resource checks only see what you pasted. A Service, ServiceAccount or Role defined elsewhere is reported as missing, usually as a warning or tip.',
    'Values are not rendered by Helm or Kustomize: paste rendered YAML (`helm template`, `kubectl kustomize`). Template syntax such as `{{ .Values.x }}` is not valid YAML.',
    'The security checks look at the container and pod `securityContext` only; Pod Security Admission, policy engines and admission webhooks in your cluster may add or relax rules.',
  ],
  privacy:
    'Everything is checked in your browser; your manifests are never uploaded or stored. Secret values are only decoded in memory and shown masked. **Share** copies a link with your YAML in the URL’s `#` fragment, which browsers do not send to servers, but anyone with the link can read it, so do not share manifests that contain real credentials. If you receive text from another tool, it is handed over through this tab’s session storage and removed as soon as it is read.',
  faqs: [
    {
      question: 'Why is a missing readiness probe a warning but a missing liveness probe only a tip?',
      answer: 'A missing readiness probe sends traffic to pods that are not ready and makes rollouts unsafe. A bad liveness probe can restart healthy pods, so it is only suggested.',
    },
    {
      question: 'Is base64 in a Secret safe?',
      answer: 'No. base64 is an encoding, anyone can decode it. Keep Secret manifests out of Git, or encrypt them with Sealed Secrets, SOPS or an external secret store.',
    },
    {
      question: 'Why does it say my Service selector matches nothing?',
      answer:
        'The selector labels must equal labels on the workload’s pod template (`spec.template.metadata.labels`), not just the workload’s own `metadata.labels`. The check only compares workloads in the same paste and namespace.',
    },
    {
      question: 'Does it replace kubectl --dry-run?',
      answer: 'No. It catches common mistakes and explains them, but only the API server knows your cluster version, CRDs and admission rules. Run `kubectl apply --dry-run=server` as well.',
    },
  ],
};

export default docs;
