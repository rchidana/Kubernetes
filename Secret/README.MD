### Kubernetes Secrets

A Secret is an object that contains a small amount of sensitive data such as a password, a token, or a key. Such information might otherwise be put in a Pod specification <br>
or in a container image. <br>
Using a Secret means that you don't need to include confidential data in your application code. <br>


One way to create a Secret is by specifying raw data:

```
kubectl create secret generic db-user-pass \
    --from-literal=username=admin \
    --from-literal=password='S!B\*d$zDsb='
```

Note: You must use single quotes '' to escape special characters such as $, \, *, =, and ! in your strings. If you don't, your shell will interpret these characters.
<br>

Verify & Check your Secret

```
kubectl get secrets
kubectl describe secret db-user-pass

#Decode the Secret
kubectl get secret db-user-pass -o jsonpath='{.data}'
echo 'UyFCXCpkJHpEc2I9' | base64 --decode
echo 'YWRtaW4=' | base64 --decode
```

### Create a busy-box pod which has this secret mounted as a volume in its mountPath - /etc/foo
