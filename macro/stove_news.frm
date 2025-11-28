VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} stove_news 
   Caption         =   "ストーブリーグニュース"
   ClientHeight    =   4590
   ClientLeft      =   50
   ClientTop       =   440
   ClientWidth     =   11830
   OleObjectBlob   =   "stove_news.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "stove_news"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False



Private Sub UserForm_Initialize()

news1.Caption = Range("data!CR1121").Value
news2.Caption = Range("data!CR1122").Value
news3.Caption = Range("data!CR1123").Value
news4.Caption = Range("data!CR1124").Value
news5.Caption = Range("data!CR1125").Value
news6.Caption = Range("data!CR1126").Value
news7.Caption = Range("data!CR1127").Value
news8.Caption = Range("data!CR1128").Value
news9.Caption = Range("data!CR1129").Value
news10.Caption = Range("data!CR1130").Value
news11.Caption = Range("data!CR1131").Value

If Range("data!CR1121").Value = "" Then
    news1.Caption = "ニュースはありません。"
End If

'ニュースないなら新聞やめる
If Not Range("data!CR1121") = "" And Not Range("data!CS1160") = 16 Then
Controls("Image" & Range("data!CS1156").Value).left = 13.5
    '新聞
    With oomidasi1_1
        .Caption = Range("data!CU1156")
        .Font.Size = Range("data!CT1143")
        .left = 170 - Range("data!CV1143")
        .Top = 48 + Range("data!CU1143")
        .ForeColor = Range("data!CS1151")
    End With
    With oomidasi2_1
        .Caption = Range("data!CU1156")
        .Font.Size = Range("data!CT1143")
        .left = 170 - Range("data!CV1143") + 1
        .Top = 48 + Range("data!CU1143") + 1
        .ForeColor = Range("data!CT1151")
    End With
    With oomidasi3_1
        .Caption = Range("data!CU1156")
        .Font.Size = Range("data!CT1143")
        .left = 170 - Range("data!CV1143") + 2
        .Top = 48 + Range("data!CU1143") + 2
        .ForeColor = Range("data!CU1151")
    End With
    
    With oomidasi1_2
        .Caption = Range("data!CV1156")
        .Font.Size = Range("data!CT1143")
        .left = 170 - Range("data!CV1143") + Range("data!CV1157")
        .Top = 48 + Range("data!CU1143") + Range("data!CV1158")
        .ForeColor = Range("data!CS1151")
    End With
    With oomidasi2_2
        .Caption = Range("data!CV1156")
        .Font.Size = Range("data!CT1143")
        .left = 170 - Range("data!CV1143") + 1 + Range("data!CV1157")
        .Top = 48 + Range("data!CU1143") + 1 + Range("data!CV1158")
        .ForeColor = Range("data!CT1151")
    End With
    With oomidasi3_2
        .Caption = Range("data!CV1156")
        .Font.Size = Range("data!CT1143")
        .left = 170 - Range("data!CV1143") + 2 + Range("data!CV1157")
        .Top = 48 + Range("data!CU1143") + 2 + Range("data!CV1158")
        .ForeColor = Range("data!CU1151")
    End With
    
    With oomidasi1_3
        .Caption = Range("data!CW1156")
        .Font.Size = Range("data!CT1143")
        .left = 170 - Range("data!CV1143") + Range("data!CW1157")
        .Top = 48 + Range("data!CU1143") + Range("data!CW1158")
        .ForeColor = Range("data!CS1151")
    End With
    With oomidasi2_3
        .Caption = Range("data!CW1156")
        .Font.Size = Range("data!CT1143")
        .left = 170 - Range("data!CV1143") + 1 + Range("data!CW1157")
        .Top = 48 + Range("data!CU1143") + 1 + Range("data!CW1158")
        .ForeColor = Range("data!CT1151")
    End With
    With oomidasi3_3
        .Caption = Range("data!CW1156")
        .Font.Size = Range("data!CT1143")
        .left = 170 - Range("data!CV1143") + 2 + Range("data!CW1157")
        .Top = 48 + Range("data!CU1143") + 2 + Range("data!CW1158")
        .ForeColor = Range("data!CU1151")
    End With
    
    nobibou.Top = Range("data!CU1157")
    
    With midasimigi1
        .Caption = Range("data!CS1145")
        .Font.Size = Range("data!CT1145")
        .left = 170 - Range("data!CV1145")
        .Top = 48 + Range("data!CU1145")
        .ForeColor = Range("data!CS1153")
    End With
    With midasimigi2
        .Caption = Range("data!CS1145")
        .Font.Size = Range("data!CT1145")
        .left = 170 - Range("data!CV1145") + 1
        .Top = 48 + Range("data!CU1145") + 1
        .ForeColor = Range("data!CT1153")
    End With
    With midasimigi3
        .Caption = Range("data!CS1145")
        .Font.Size = Range("data!CT1145")
        .left = 170 - Range("data!CV1145") + 2
        .Top = 48 + Range("data!CU1145") + 2
        .ForeColor = Range("data!CU1153")
    End With
    
    With midasisita1
        .Caption = Range("data!CS1147")
        .Font.Size = Range("data!CT1147")
        .left = 170 - Range("data!CV1147")
        .Top = 48 + Range("data!CU1147")
        .ForeColor = Range("data!CS1155")
    End With
    With midasisita2
        .Caption = Range("data!CS1147")
        .Font.Size = Range("data!CT1147")
        .left = 170 - Range("data!CV1147") + 1
        .Top = 48 + Range("data!CU1147") + 1
        .ForeColor = Range("data!CT1155")
    End With
    With midasisita3
        .Caption = Range("data!CS1147")
        .Font.Size = Range("data!CT1147")
        .left = 170 - Range("data!CV1147") + 1.5
        .Top = 48 + Range("data!CU1147") + 1.5
        .ForeColor = Range("data!CU1155")
    End With
    
    With midasihidari1
        .Caption = Range("data!CS1148")
        .Font.Size = Range("data!CT1148")
        .left = 170 - Range("data!CV1148")
        .Top = 48 + Range("data!CU1148")
        .ForeColor = Range("data!CS1152")
    End With
    With midasihidari2
        .Caption = Range("data!CS1148")
        .Font.Size = Range("data!CT1148")
        .left = 170 - Range("data!CV1148") + 1
        .Top = 48 + Range("data!CU1148") + 1
        .ForeColor = Range("data!CT1152")
    End With
    With midasihidari3
        .Caption = Range("data!CS1148")
        .Font.Size = Range("data!CT1148")
        .left = 170 - Range("data!CV1148") + 2
        .Top = 48 + Range("data!CU1148") + 2
        .ForeColor = Range("data!CU1152")
    End With
    
    With midasiue1
        .Caption = Range("data!CS1146")
        .Font.Size = Range("data!CT1146")
        .left = 170 - Range("data!CV1146") - 70
        .Top = 48 + Range("data!CU1146")
        .ForeColor = Range("data!CS1154")
    End With
    With midasiue2
        .Caption = Range("data!CS1146")
        .Font.Size = Range("data!CT1146")
        .left = 170 - Range("data!CV1146") + 1 - 70
        .Top = 48 + Range("data!CU1146") + 1
        .ForeColor = Range("data!CT1154")
    End With
    
    With hokan1
        .Caption = Range("data!CS1144")
        .Font.Size = Range("data!CT1144")
        .left = 170 - Range("data!CV1144")
        .Top = 48 + Range("data!CU1144")
        .ForeColor = Range("data!CS1151")
    End With
    With hokan2
        .Caption = Range("data!CS1144")
        .Font.Size = Range("data!CT1144")
        .left = 170 - Range("data!CV1144") + 1
        .Top = 48 + Range("data!CU1144") + 1
        .ForeColor = Range("data!CT1151")
    End With
    With hokan3
        .Caption = Range("data!CS1144")
        .Font.Size = Range("data!CT1144")
        .left = 170 - Range("data!CV1144") + 2
        .Top = 48 + Range("data!CU1144") + 2
        .ForeColor = Range("data!CU1151")
    End With
End If

End Sub
