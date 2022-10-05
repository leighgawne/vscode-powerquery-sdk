let
    vUrl = "https://eu.api.nexar.com/graphql",
    vHeaders =[
			#"Method"="POST",
			#"Content-Type"="application/json",
			#"authorization"="Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjA5NzI5QTkyRDU0RDlERjIyRDQzMENBMjNDNkI4QjJFIiwidHlwIjoiYXQrand0In0.eyJuYmYiOjE2NjQ5NzI4ODgsImV4cCI6MTY2NTA1OTI4OCwiaXNzIjoiaHR0cHM6Ly9pZGVudGl0eS5uZXhhci5jb20iLCJjbGllbnRfaWQiOiJiMDg5YWViYy1kZDhiLTQwZTEtYjQ0ZS03YThlYmFmMjUwM2IiLCJzdWIiOiJDQUI1NjlFMS0yRTQ3LTQwRTktQTFBMC05RTA3NUU4MzBCQjAiLCJhdXRoX3RpbWUiOjE2NjM3MTE4MTcsImlkcCI6ImxvY2FsIiwianRpIjoiQjc5QTVFQUMwRDBDNEFCNTlBOEQ2RUI5MzcwMzIyRTciLCJpYXQiOjE2NjQ5NzI4ODgsInNjb3BlIjpbIm9wZW5pZCIsInByb2ZpbGUiLCJlbWFpbCIsInVzZXIuYWNjZXNzIiwiZGVzaWduLmRvbWFpbiIsIm9mZmxpbmVfYWNjZXNzIl0sImFtciI6WyJwd2QiXX0.RPQU8WZ46dHPsKTi3t0jDn5P8DJlTSLq5hbCfgSRwkraJu2--H4Lb2F2Oq7o6ImwPlK-mhU-VaQQgiUBFPymoI_rkZMzNSlCMSuCc0KZBG-aNm3yS_RC6BwBvz8zMHaO3J-Lgug0LXxaqB1qAlgJoHiVCUMOuCMsjWeT25fgnDV1s76AGVYJVDdrUaSfqA5LeVJCnFb-gRZOdkyZNYxS5fnmfAEhnd-bbb-bpVu-JXXBcktuv0tMgMNOEtig1JZ_IaIbtf3XuAusTUphx8JwaAXNrfwL6uXwNQo-SPHEOB-0QIWndjjFwdTO6O-cDZhrMnnx0sEoVSHzib-0jFS4FQ"
		],
    // Notice the quote escaping here
    vContent = Text.ToBinary(
        "{
            ""operationName"":""GetWorkspaces"",
            ""query"":""query GetWorkspaces { desWorkspaces { id url name } }""}"),    
    Source = Web.Contents(vUrl,	[Headers=vHeaders, Content=vContent]),
    #"JSON" = Json.Document(Source)
in
    #"JSON"