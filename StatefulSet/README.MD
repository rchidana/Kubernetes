# First Create sts using the following YAML
# Watch the order in which the pods get created

# In one terminal, watch pods with label app=nginx

```
kubectl get pods --watch -l app=nginx
```

# In another tab, deploy sts 

```
kubectl apply -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  ports:
  - port: 80
    name: web
  clusterIP: None
  selector:
    app: nginx
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: web
spec:
  serviceName: "nginx"
  replicas: 2
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:alpine
        ports:
        - containerPort: 80
          name: web
        volumeMounts:
        - name: www
          mountPath: /usr/share/nginx/html
  volumeClaimTemplates:
  - metadata:
      name: www
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 1Mi
EOF
```

# Then follow instructions from this tutorial : <br>
https://kubernetes.io/docs/tutorials/stateful-application/basic-stateful-set/ <br>
