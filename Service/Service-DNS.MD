### Exercise to check DNS names assigned for default Services (ClusterIP)

Let us create a namespace called "demo" and deploy a simple nginx deployment in it

```
kubectl create ns demo
kubectl -n demo apply -f https://k8s.io/examples/application/deployment-update.yaml

# Check IP address of Pod(s)
kubectl get po -o wide - demo

# Let us expose this deployment as a service by providing a specific name - 'nginx-svc'

kubectl expose deploy -n demo nginx-deployment --name=nginx-svc

# Verify the Endpoints of Service
kubectl describe service -n demo
kubectl get ep -n demo

# Let us spin up a network debugger pod to verify the FQDN of our service

kubectl -n demo run tmp-shell --rm -i --tty --image nicolaka/netshoot -- /bin/bash

# Inside the pod, try to nslookup our service - 'nginx-svc'
nslookup nginx-svc

```

The Default FQDN provided by K8s follows this pattern --> serviceName.namespaceName.cluster-name and in our local cluster, <br>
it defaults to serviceName.namespaceName.svc.cluster.local
