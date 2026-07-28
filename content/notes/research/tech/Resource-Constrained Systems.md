---
title: Resource-Constrained Systems
description: Devices with strict limits on compute, memory, storage and energy.
number:
timestamp: 2025-11-25T01:35:00
icon: Lightbulb
tags:
  - farm-orchestra
  - iot
---
A resource-constrained system is 
a device with **limited computing power, 
memory, energy, or storage**.

Examples include Raspberry Pi, 
ESP32 and many agricultural sensors.

Designing reliable software under these constraints is one of the main challenges of IoT engineering.

---
## Strict Limits

**Resource-Constrained Systems** are characterised by having strict limits on **compute**, **memory**, **storage** and **energy**, influencing design, development and deployment choices. 

These systems run on low resources, so they are more available, sustainable and maintainable, but do have some **security challenges** as well. 

In [[Precision Agriculture]], one of the main goals is to reduce the use of resources such as water, light or energy (see [[Resource Efficiency]]. With **Resource-Constrained Systems**, we try to accomplish the same goal but on the technological layer. 

> [!warning] Security Challenges
> Resource-constrained IoT devices face particular security challenges that originate from fundamental hardware limitations, trust management complexities, and systemic architectural vulnerabilities [[#(1)]]. 

Since **Resource-Constrained IoT Devices** need to take in mind the computational overhead, light-weight algorithms, criptography and systems need to be implemented from early development [[#(1)]].

Although deploying these kind of systems inside a [[Controlled Environment Agriculture]], may have real positive impacts, the [[Cybersecurity in CEA]] needs to be much more robust in these cases. 

> This resource-conscious approach ensures that these devices can fulfill their roles effectively without becoming a burden on resources or energy consumption. [[#(2)]]

## Common Constraints 

1. Complexity Challenge 
2. Memory Constraints 
3. Energy Efficiency Dilemma 
4. Network Limitations 
5. Security Considerations

## Problems inside IoT Devices 

1. Limited battery 
2. Small memory (RAM / Flash)
3. Low processing power

## Memory Optimisation Techniques 

- Buffering 
- Data compression 
- Efficient data structures 

---
## Benefits

As stated by [[#(2)]], these limitations are not drawbacks, but strategic choices that serve specific purposes. They are Design choices with multiple benefits such as:  

1. Efficiency and Energy Conservation 
2. Cost-Effectiveness 
3. Specialized Functionality 
4. Scalability 
5. Reduced Maintenance 
6. Low Network overhead

## References 

#### (1)

Neagu, M.; Serban, C.M.; Hangan, A.; Sebestyen, G. Trustworthiness in Resource-Constrained IoT: Review and Taxonomy of Privacy-Enhancing Technologies and Anomaly Detection. _Telecom_ **2026**, _7_, 10. https://doi.org/10.3390/telecom7010010

#### (2)

Medium, Poonam G, *Managing Resource-Constrained IoT Devices: Unlocking Potential Amidst Limitations*. https://medium.com/plexusbit-software/managing-resource-constrained-iot-devices-unlocking-potential-amidst-limitations-be932269e846

#### (3)

Youtube. Learn@Home. *Resource System Constraint Design*.
https://www.youtube.com/watch?v=ngWnvUcFosY

#### (4)

Nawaz, Majid & Babar, Muhammad. (2025). IoT and AI for smart agriculture in resource-constrained environments: challenges, opportunities and solutions. Discover Internet of Things. 5. 10.1007/s43926-025-00119-3. 
https://www.researchgate.net/publication/389822619_IoT_and_AI_for_smart_agriculture_in_resource-constrained_environments_challenges_opportunities_and_solutions