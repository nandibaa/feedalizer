# feedializer

Playing with Swarm Feed and mantaray-js

The goal is to implement a JSON like data storage using swarm feed and mantaray-js.
Swarm feed provides that the storage url (aka. root or seed hash) will remain the same during updateting the data with bee-js.
With Mantaray a manifest can be declared to make all the different storage files reachable from the root address.

For example:
get('profile') will return the file stored on the root/profile.json file

put('profile', object) will update the feed and the file on the root/profile.json file
