VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} UserForm30 
   Caption         =   "各球団指名一覧"
   ClientHeight    =   5175
   ClientLeft      =   50
   ClientTop       =   440
   ClientWidth     =   8050
   OleObjectBlob   =   "UserForm30.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "UserForm30"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub UserForm_Click()

End Sub

Private Sub UserForm_Initialize()

Frame1.Caption = Range("ドラフト会議!ES3")
Frame2.Caption = Range("ドラフト会議!ET3")
Frame3.Caption = Range("ドラフト会議!EU3")
Frame4.Caption = Range("ドラフト会議!EV3")
Frame5.Caption = Range("ドラフト会議!EW3")
Frame6.Caption = Range("ドラフト会議!EX3")

Label1.Caption = Range("ドラフト会議!ES50") & vbCrLf & Range("ドラフト会議!ES51") & vbCrLf & Range("ドラフト会議!ES52") & vbCrLf & Range("ドラフト会議!ES53") & vbCrLf & Range("ドラフト会議!ES54") & vbCrLf & Range("ドラフト会議!ES55") & vbCrLf & Range("ドラフト会議!ES56") & vbCrLf & Range("ドラフト会議!ES57") & vbCrLf & Range("ドラフト会議!ES58") & vbCrLf & Range("ドラフト会議!ES59")
Label2.Caption = Range("ドラフト会議!ET50") & vbCrLf & Range("ドラフト会議!ET51") & vbCrLf & Range("ドラフト会議!ET52") & vbCrLf & Range("ドラフト会議!ET53") & vbCrLf & Range("ドラフト会議!ET54") & vbCrLf & Range("ドラフト会議!ET55") & vbCrLf & Range("ドラフト会議!ET56") & vbCrLf & Range("ドラフト会議!ET57") & vbCrLf & Range("ドラフト会議!ET58") & vbCrLf & Range("ドラフト会議!ET59")
Label3.Caption = Range("ドラフト会議!EU50") & vbCrLf & Range("ドラフト会議!EU51") & vbCrLf & Range("ドラフト会議!EU52") & vbCrLf & Range("ドラフト会議!EU53") & vbCrLf & Range("ドラフト会議!EU54") & vbCrLf & Range("ドラフト会議!EU55") & vbCrLf & Range("ドラフト会議!EU56") & vbCrLf & Range("ドラフト会議!EU57") & vbCrLf & Range("ドラフト会議!EU58") & vbCrLf & Range("ドラフト会議!EU59")
Label4.Caption = Range("ドラフト会議!EV50") & vbCrLf & Range("ドラフト会議!EV51") & vbCrLf & Range("ドラフト会議!EV52") & vbCrLf & Range("ドラフト会議!EV53") & vbCrLf & Range("ドラフト会議!EV54") & vbCrLf & Range("ドラフト会議!EV55") & vbCrLf & Range("ドラフト会議!EV56") & vbCrLf & Range("ドラフト会議!EV57") & vbCrLf & Range("ドラフト会議!EV58") & vbCrLf & Range("ドラフト会議!EV59")
Label5.Caption = Range("ドラフト会議!EW50") & vbCrLf & Range("ドラフト会議!EW51") & vbCrLf & Range("ドラフト会議!EW52") & vbCrLf & Range("ドラフト会議!EW53") & vbCrLf & Range("ドラフト会議!EW54") & vbCrLf & Range("ドラフト会議!EW55") & vbCrLf & Range("ドラフト会議!EW56") & vbCrLf & Range("ドラフト会議!EW57") & vbCrLf & Range("ドラフト会議!EW58") & vbCrLf & Range("ドラフト会議!EW59")
Label6.Caption = Range("ドラフト会議!EX50") & vbCrLf & Range("ドラフト会議!EX51") & vbCrLf & Range("ドラフト会議!EX52") & vbCrLf & Range("ドラフト会議!EX53") & vbCrLf & Range("ドラフト会議!EX54") & vbCrLf & Range("ドラフト会議!EX55") & vbCrLf & Range("ドラフト会議!EX56") & vbCrLf & Range("ドラフト会議!EX57") & vbCrLf & Range("ドラフト会議!EX58") & vbCrLf & Range("ドラフト会議!EX59")


End Sub
